import { AppError } from '../../../middleware/errorHandler';
import { xpService } from './xp.service';

export interface DailyMission {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  targetCount: number;
}

const DEFAULT_DAILY_MISSIONS: DailyMission[] = [
  {
    id: 'daily-first-lab',
    title: 'Lab Explorer',
    description: 'Complete 1 virtual lab experiment today.',
    xpReward: 50,
    targetCount: 1,
  },
  {
    id: 'daily-streak-checkin',
    title: 'Consistent Learner',
    description: 'Complete any learning unit to maintain your streak.',
    xpReward: 25,
    targetCount: 1,
  },
];

/**
 * Service managing daily and weekly learning missions.
 */
export class MissionService {
  async listActiveMissions(_userId: string): Promise<DailyMission[]> {
    return DEFAULT_DAILY_MISSIONS;
  }

  async completeMission(userId: string, missionId: string) {
    const mission = DEFAULT_DAILY_MISSIONS.find((m) => m.id === missionId);
    if (!mission) {
      throw new AppError('Mission not found', 404, 'MISSION_NOT_FOUND');
    }

    const result = await xpService.awardXp({
      userId,
      amount: mission.xpReward,
      sourceType: 'mission',
      sourceId: mission.id,
      description: `Completed mission: ${mission.title}`,
    });

    return {
      missionId: mission.id,
      xpAwarded: result.xpAwarded,
      totalXp: result.progress.totalXp,
      level: result.progress.level,
    };
  }
}

export const missionService = new MissionService();
