import { describe, expect, it } from 'vitest';
import { labRegistryService } from '../../labs/services/labRegistry.service';
import { codingContentService } from '../services/codingContent.service';
import { normalizeProgramOutput } from '../services/codingExecution.service';

describe('Coding Module', () => {
  it('loads all 8 coding levels and 40 challenges with 3 languages', async () => {
    const levels = await codingContentService.listLevels();
    expect(levels).toHaveLength(8);

    let totalChallenges = 0;
    for (let i = 0; i < levels.length; i += 1) {
      const lvl = levels[i];
      expect(lvl.levelNumber).toBe(i + 1);
      expect(lvl.missionSlug).toBe(`code-${i + 1}`);
      expect(lvl.challengeIds).toHaveLength(5);

      const { challenges } = await codingContentService.getLevelWithChallenges(lvl.levelId);
      expect(challenges).toHaveLength(5);

      for (const ch of challenges) {
        expect(ch.starterCode.python.trim().length).toBeGreaterThan(0);
        expect(ch.starterCode.javascript.trim().length).toBeGreaterThan(0);
        expect(ch.starterCode.java).toContain('public class Main');
        expect(ch.publicTestCases.length).toBeGreaterThanOrEqual(1);
        expect(ch.hiddenTestCaseCount).toBeGreaterThanOrEqual(1);
        expect((ch as unknown as { hiddenTestCases?: unknown }).hiddenTestCases).toBeUndefined();
        totalChallenges += 1;
      }
    }
    expect(totalChallenges).toBe(40);
  });

  it('registers all 8 coding_ide labs in labs.manifest.json', async () => {
    const codingLabs = await labRegistryService.listEnabledLabs('coding');
    expect(codingLabs).toHaveLength(8);
    for (let i = 1; i <= 8; i += 1) {
      const lab = codingLabs.find((l) => l.labId === `coding-level-${i}`);
      expect(lab).toBeDefined();
      expect(lab?.labFormat).toBe('coding_ide');
      expect(lab?.associatedMissionSlugs).toContain(`code-${i}`);
    }
  });

  it('normalizes program output safely without collapsing internal whitespace', () => {
    expect(normalizeProgramOutput('Hello, World!  \r\n\r\n')).toBe('Hello, World!');
    expect(normalizeProgramOutput('\n1 2\r\n3 4 \n\n')).toBe('1 2\n3 4');
    expect(normalizeProgramOutput('a   b')).toBe('a   b');
  });
});
