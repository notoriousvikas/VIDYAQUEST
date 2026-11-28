import { env } from '../../../config/env';
import { AppError } from '../../../middleware/errorHandler';
import { CodingLanguage } from '../models/CodingTypes';
import { codingContentService } from './codingContent.service';

const HINT_RATE_LIMIT_MAX = 15;
const HINT_WINDOW_MS = 60_000;
const hintTimestampsByStudent = new Map<string, number[]>();

function assertWithinHintRateLimit(studentId: string): void {
  const now = Date.now();
  const windowStart = now - HINT_WINDOW_MS;
  const recent = (hintTimestampsByStudent.get(studentId) ?? []).filter(
    (ts) => ts > windowStart,
  );
  if (recent.length >= HINT_RATE_LIMIT_MAX) {
    throw new AppError(
      'Too many mentor requests. Take a moment to test your code and try again.',
      429,
      'MENTOR_RATE_LIMITED',
    );
  }
  recent.push(now);
  hintTimestampsByStudent.set(studentId, recent);
}

const HINT_STYLE: Record<1 | 2 | 3, string> = {
  1: 'Give ONLY a gentle conceptual direction (Hint 1). Do NOT write code.',
  2: 'Give specific guidance pointing out what logic or edge case to check in their current code (Hint 2). Do NOT give the full solution.',
  3: 'Provide a clear step-by-step approach or short pseudocode (Hint 3), still encouraging the student to write the final code themselves.',
};

export class CodingMentorService {
  async getHint(params: {
    studentId: string;
    challengeId: string;
    language: CodingLanguage;
    code: string;
    hintLevel: 1 | 2 | 3;
    errorOutput?: string;
    question?: string;
  }) {
    assertWithinHintRateLimit(params.studentId);

    // Fetch challenge and explicitly ignore hiddenTestCases
    const challenge = await codingContentService.getPublicChallengeById(params.challengeId);
    const fallbackHint =
      challenge.hints[params.hintLevel - 1] ??
      challenge.hints[0] ??
      'Break the problem into small steps: read input, process, and print output.';

    const groqKey = env.GROQ_API_KEY;
    if (!groqKey) {
      return {
        hintLevel: params.hintLevel,
        source: 'curriculum' as const,
        message: fallbackHint,
      };
    }

    const systemPrompt = [
      'You are the VidyaQuest AI Coding Mentor for school students.',
      'Be encouraging, concise, and beginner-friendly.',
      'NEVER reveal the complete working solution.',
      HINT_STYLE[params.hintLevel],
    ].join(' ');

    const userPrompt = [
      `Problem: ${challenge.title} (${challenge.topic}, ${challenge.difficulty})`,
      `Description: ${challenge.description}`,
      `Language: ${params.language}`,
      `Student's current code:\n\`\`\`${params.language}\n${params.code.slice(0, 4000)}\n\`\`\``,
      params.errorOutput ? `Observed error/output:\n${params.errorOutput.slice(0, 1000)}` : '',
      params.question ? `Student's question: ${params.question.slice(0, 400)}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);

    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${groqKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: env.GROQ_MODEL,
          temperature: 0.4,
          max_tokens: 320,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        return {
          hintLevel: params.hintLevel,
          source: 'curriculum' as const,
          message: fallbackHint,
        };
      }

      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const aiMessage = data.choices?.[0]?.message?.content?.trim();

      return {
        hintLevel: params.hintLevel,
        source: aiMessage ? ('groq' as const) : ('curriculum' as const),
        message: aiMessage || fallbackHint,
      };
    } catch {
      return {
        hintLevel: params.hintLevel,
        source: 'curriculum' as const,
        message: fallbackHint,
      };
    } finally {
      clearTimeout(timer);
    }
  }
}

export const codingMentorService = new CodingMentorService();
