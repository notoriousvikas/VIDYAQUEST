import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import { AppError } from '../../../middleware/errorHandler';

const verificationQuestionSchema = z.object({
  id: z.string().min(1),
  prompt: z.string().min(1),
  options: z.array(z.string().min(1)).min(2),
  correctIndex: z.number().int().min(0),
});

const labManifestEntrySchema = z.object({
  labId: z.string().min(1),
  subjectSlug: z.string().min(1),
  associatedMissionSlugs: z.array(z.string().min(1)).default([]),
  title: z.string().min(1),
  description: z.string().default(''),
  difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Master']).default('Beginner'),
  estimatedDurationMinutes: z.number().int().min(1).default(10),
  enabled: z.boolean().default(true),
  labFormat: z.enum(['html_3d', 'three_model', 'interactive_config', 'coding_ide']).default('html_3d'),
  entryAsset: z.string().min(1),
  instructions: z.array(z.string()).default([]),
  interactionConfig: z
    .object({
      mode: z.string().default('generic_3d'),
      supportsRotation: z.boolean().default(true),
      supportsZoom: z.boolean().default(true),
      supportsReset: z.boolean().default(true),
      observationPrompts: z.array(z.string()).default([]),
    })
    .default({}),
  completionCriteria: z
    .object({
      minStepsCompleted: z.number().int().min(0).default(1),
      minObservations: z.number().int().min(0).default(0),
      verificationQuestions: z.array(verificationQuestionSchema).default([]),
    })
    .default({}),
});

const manifestSchema = z.object({
  version: z.number().int().default(1),
  labs: z.array(labManifestEntrySchema),
});

export type LabManifestEntry = z.infer<typeof labManifestEntrySchema>;

export interface PublicLabMetadata
  extends Omit<LabManifestEntry, 'completionCriteria'> {
  completionCriteria: {
    minStepsCompleted: number;
    minObservations: number;
    verificationQuestions: Array<{
      id: string;
      prompt: string;
      options: string[];
    }>;
  };
  assetUrl: string;
}

function resolveLabRootDir(): string {
  const candidates = [
    process.env.VIDYAQUEST_LAB_DIR,
    path.resolve(process.cwd(), '../lab'),
    path.resolve(process.cwd(), 'lab'),
    path.resolve(__dirname, '../../../../../lab'),
    path.resolve(__dirname, '../../../../lab'),
  ].filter((p): p is string => Boolean(p));

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return candidates[0];
}

let cachedMtimeMs = -1;
let cachedLabs: LabManifestEntry[] = [];

export class LabRegistryService {
  getLabRootDir(): string {
    return resolveLabRootDir();
  }

  private async loadManifest(): Promise<LabManifestEntry[]> {
    const labRoot = this.getLabRootDir();
    const manifestPath = path.join(labRoot, 'labs.manifest.json');

    if (!fs.existsSync(manifestPath)) {
      return [];
    }

    const stat = await fs.promises.stat(manifestPath);
    if (stat.mtimeMs === cachedMtimeMs && cachedLabs.length > 0) {
      return cachedLabs;
    }

    const raw = await fs.promises.readFile(manifestPath, 'utf-8');
    const parsed = manifestSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      throw new AppError(
        'Lab manifest configuration is invalid',
        500,
        'LAB_MANIFEST_INVALID',
      );
    }

    cachedMtimeMs = stat.mtimeMs;
    cachedLabs = parsed.data.labs;
    return cachedLabs;
  }

  sanitizeForStudent(entry: LabManifestEntry): PublicLabMetadata {
    return {
      labId: entry.labId,
      subjectSlug: entry.subjectSlug,
      associatedMissionSlugs: entry.associatedMissionSlugs,
      title: entry.title,
      description: entry.description,
      difficulty: entry.difficulty,
      estimatedDurationMinutes: entry.estimatedDurationMinutes,
      enabled: entry.enabled,
      labFormat: entry.labFormat,
      entryAsset: entry.entryAsset,
      instructions: entry.instructions,
      interactionConfig: entry.interactionConfig,
      completionCriteria: {
        minStepsCompleted: entry.completionCriteria.minStepsCompleted,
        minObservations: entry.completionCriteria.minObservations,
        verificationQuestions: entry.completionCriteria.verificationQuestions.map((q) => ({
          id: q.id,
          prompt: q.prompt,
          options: q.options,
        })),
      },
      assetUrl: `/api/v1/labs/assets/${encodeURIComponent(entry.labId)}/${encodeURIComponent(entry.entryAsset)}`,
    };
  }

  async listEnabledLabs(subjectSlug?: string): Promise<PublicLabMetadata[]> {
    const labs = await this.loadManifest();
    return labs
      .filter((l) => l.enabled && (!subjectSlug || l.subjectSlug === subjectSlug))
      .map((l) => this.sanitizeForStudent(l));
  }

  async getEnabledLabById(labId: string): Promise<LabManifestEntry> {
    const labs = await this.loadManifest();
    const found = labs.find((l) => l.labId === labId && l.enabled);
    if (!found) {
      throw new AppError('Virtual lab not found', 404, 'LAB_NOT_FOUND');
    }
    return found;
  }

  async resolveLabForMission(
    missionSlug: string,
    contentReference?: string,
  ): Promise<LabManifestEntry | null> {
    const labs = await this.loadManifest();
    const enabled = labs.filter((l) => l.enabled);

    if (contentReference) {
      const byRef = enabled.find((l) => l.labId === contentReference);
      if (byRef) return byRef;
    }

    const byMissionSlug = enabled.find((l) =>
      l.associatedMissionSlugs.includes(missionSlug.toLowerCase()),
    );
    return byMissionSlug ?? null;
  }

  async resolveAssetFilePath(labId: string, requestedAsset?: string): Promise<string> {
    const lab = await this.getEnabledLabById(labId);
    const labRoot = path.resolve(this.getLabRootDir());
    const targetRelative =
      requestedAsset && requestedAsset.trim().length > 0
        ? requestedAsset
        : lab.entryAsset;

    const resolved = path.resolve(labRoot, targetRelative);
    if (!resolved.startsWith(labRoot + path.sep) && resolved !== labRoot) {
      throw new AppError('Invalid lab asset path', 403, 'LAB_ASSET_FORBIDDEN');
    }

    if (!fs.existsSync(resolved)) {
      throw new AppError('Lab asset file not found', 404, 'LAB_ASSET_NOT_FOUND');
    }

    return resolved;
  }
}

export const labRegistryService = new LabRegistryService();
