import { env } from '../../../config/env';
import { AppError } from '../../../middleware/errorHandler';
import { CodingLanguage } from '../models/CodingTypes';

const COMPILER_MAP: Record<CodingLanguage, string> = {
  python: 'python-3.14',
  javascript: 'nodejs-24',
  java: 'openjdk-25',
};

const REQUEST_TIMEOUT_MS = 15000;

export type ExecutionOutcomeStatus =
  | 'SUCCESS'
  | 'COMPILATION_ERROR'
  | 'RUNTIME_ERROR'
  | 'TIMEOUT'
  | 'PROVIDER_ERROR';

export interface OnlineCompilerExecutionResult {
  status: ExecutionOutcomeStatus;
  output: string;
  error: string;
  exitCode: number | null;
  time?: string;
  memory?: string;
}

interface OnlineCompilerApiResponse {
  output?: string;
  error?: string;
  status?: string;
  exit_code?: number | null;
  signal?: string | null;
  time?: string;
  memory?: string;
  detail?: string;
  message?: string;
}

function classifyExecutionResult(
  language: CodingLanguage,
  data: OnlineCompilerApiResponse,
): ExecutionOutcomeStatus {
  const errText = (data.error ?? '').toLowerCase();
  const statusText = (data.status ?? '').toLowerCase();

  if (
    statusText.includes('timeout') ||
    data.signal === 'SIGKILL' ||
    data.signal === 'SIGXCPU' ||
    errText.includes('time limit exceeded')
  ) {
    return 'TIMEOUT';
  }

  if (data.status === 'success' && (data.exit_code === 0 || data.exit_code == null)) {
    return 'SUCCESS';
  }

  if (
    language === 'java' &&
    (errText.includes('error:') || errText.includes('cannot find symbol') || errText.includes('reached end of file'))
  ) {
    return 'COMPILATION_ERROR';
  }

  if (
    language === 'python' &&
    (errText.includes('syntaxerror') || errText.includes('indentationerror') || errText.includes('taberror'))
  ) {
    return 'COMPILATION_ERROR';
  }

  if (language === 'javascript' && errText.includes('syntaxerror')) {
    return 'COMPILATION_ERROR';
  }

  return 'RUNTIME_ERROR';
}

export class OnlineCompilerService {
  async execute(params: {
    language: CodingLanguage;
    code: string;
    input?: string;
  }): Promise<OnlineCompilerExecutionResult> {
    const apiKey = env.ONLINECOMPILER_API_KEY;
    if (!apiKey) {
      throw new AppError(
        'Code execution service is not configured (missing ONLINECOMPILER_API_KEY).',
        503,
        'EXECUTION_PROVIDER_UNCONFIGURED',
      );
    }

    const compiler = COMPILER_MAP[params.language];
    if (!compiler) {
      throw new AppError('Unsupported programming language', 400, 'UNSUPPORTED_LANGUAGE');
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(env.ONLINECOMPILER_API_URL, {
        method: 'POST',
        headers: {
          Authorization: apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          compiler,
          code: params.code,
          input: params.input ?? '',
        }),
        signal: controller.signal,
      });

      const payload = (await response.json().catch(() => null)) as OnlineCompilerApiResponse | null;

      if (!response.ok || !payload) {
        return {
          status: 'PROVIDER_ERROR',
          output: '',
          error:
            payload?.detail ||
            payload?.message ||
            `Execution provider returned HTTP ${response.status}`,
          exitCode: null,
        };
      }

      const outcomeStatus = classifyExecutionResult(params.language, payload);
      return {
        status: outcomeStatus,
        output: payload.output ?? '',
        error: payload.error ?? '',
        exitCode: payload.exit_code ?? null,
        time: payload.time,
        memory: payload.memory,
      };
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        return {
          status: 'TIMEOUT',
          output: '',
          error: 'Execution timed out after 15 seconds.',
          exitCode: null,
        };
      }
      return {
        status: 'PROVIDER_ERROR',
        output: '',
        error: 'Unable to reach code execution provider. Please try again.',
        exitCode: null,
      };
    } finally {
      clearTimeout(timer);
    }
  }
}

export const onlineCompilerService = new OnlineCompilerService();
