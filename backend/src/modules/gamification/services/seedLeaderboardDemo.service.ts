import { SubjectModel } from '../../catalog/models/Subject.model';
import {
  DEFAULT_AVATAR_APPEARANCE,
  DEFAULT_EQUIPPED_ITEMS,
  StudentAvatarModel,
} from '../../users/models/StudentAvatar.model';
import { StudentProfileModel } from '../../users/models/StudentProfile.model';
import { AchievementModel } from '../models/Achievement.model';
import { MissionModel } from '../models/Mission.model';
import { PlayerProgressModel } from '../models/PlayerProgress.model';
import { StudentMissionProgressModel } from '../models/StudentMissionProgress.model';
import { UserAchievementModel } from '../models/UserAchievement.model';
import { XPTransactionModel } from '../models/XPTransaction.model';
import { calculateLevelFromXp } from './xp.service';

interface DemoStudentSeed {
  studentId: string;
  displayName: string;
  classGrade: string;
  school: string;
  schoolLocation: string;
  showSchoolOnLeaderboard: boolean;
  streakDays: number;
  skinTone: string;
  hairstyle: string;
  hairColor: string;
  outfit: string;
  subjectXp: {
    chemistry: number;
    physics: number;
    biology: number;
    mathematics: number;
  };
  weeklyShareRatio: number;
  achievementCodes: string[];
}

const DEMO_STUDENTS: DemoStudentSeed[] = [
  {
    studentId: 'demo-student-blr-1',
    displayName: 'Ananya Rao',
    classGrade: '8',
    school: 'National Public School, Indiranagar',
    schoolLocation: 'Bangalore, Karnataka',
    showSchoolOnLeaderboard: true,
    streakDays: 12,
    skinTone: 'skin-warm',
    hairstyle: 'hair-waves',
    hairColor: 'haircolor-midnight',
    outfit: 'outfit-robe-alchemy',
    subjectXp: { chemistry: 240, physics: 180, biology: 140, mathematics: 210 },
    weeklyShareRatio: 0.45,
    achievementCodes: ['FIRST_STEPS', 'SCIENCE_EXPLORER', 'OPPORTUNITY_SEEKER'],
  },
  {
    studentId: 'demo-student-blr-2',
    displayName: 'Rohan Hegde',
    classGrade: '8',
    school: 'National Public School, Indiranagar',
    schoolLocation: 'Bangalore, Karnataka',
    showSchoolOnLeaderboard: true,
    streakDays: 9,
    skinTone: 'skin-tan',
    hairstyle: 'hair-spiky',
    hairColor: 'haircolor-espresso',
    outfit: 'outfit-jacket-atom',
    subjectXp: { chemistry: 150, physics: 260, biology: 90, mathematics: 190 },
    weeklyShareRatio: 0.5,
    achievementCodes: ['FIRST_STEPS', 'INNOVATION_STAR'],
  },
  {
    studentId: 'demo-student-blr-3',
    displayName: 'Meera Krishnan',
    classGrade: '9',
    school: 'Delhi Public School, Whitefield',
    schoolLocation: 'Bangalore, Karnataka',
    showSchoolOnLeaderboard: true,
    streakDays: 15,
    skinTone: 'skin-deep',
    hairstyle: 'hair-ponytail',
    hairColor: 'haircolor-midnight',
    outfit: 'outfit-armor-royal',
    subjectXp: { chemistry: 210, physics: 195, biology: 250, mathematics: 225 },
    weeklyShareRatio: 0.4,
    achievementCodes: ['FIRST_STEPS', 'CURIOUS_MIND', 'SCIENCE_EXPLORER'],
  },
  {
    studentId: 'demo-student-blr-4',
    displayName: 'Karthik Gowda',
    classGrade: '8',
    school: 'Bishop Cotton Boys School',
    schoolLocation: 'Bangalore, Karnataka',
    showSchoolOnLeaderboard: true,
    streakDays: 6,
    skinTone: 'skin-tan',
    hairstyle: 'hair-explorer',
    hairColor: 'haircolor-espresso',
    outfit: 'outfit-tunic-emerald',
    subjectXp: { chemistry: 110, physics: 145, biology: 120, mathematics: 175 },
    weeklyShareRatio: 0.6,
    achievementCodes: ['FIRST_STEPS', 'OPPORTUNITY_SEEKER'],
  },
  {
    studentId: 'demo-student-blr-5',
    displayName: 'Diya Shetty',
    classGrade: '7',
    school: 'Delhi Public School, Whitefield',
    schoolLocation: 'Bangalore, Karnataka',
    showSchoolOnLeaderboard: true,
    streakDays: 8,
    skinTone: 'skin-fair',
    hairstyle: 'hair-waves',
    hairColor: 'haircolor-amber',
    outfit: 'outfit-robe-alchemy',
    subjectXp: { chemistry: 185, physics: 115, biology: 160, mathematics: 140 },
    weeklyShareRatio: 0.55,
    achievementCodes: ['FIRST_STEPS', 'SCIENCE_EXPLORER'],
  },
  {
    studentId: 'demo-student-jai-1',
    displayName: 'Aarav Sharma',
    classGrade: '8',
    school: 'St. Xavier Senior Secondary',
    schoolLocation: 'Jaipur, Rajasthan',
    showSchoolOnLeaderboard: true,
    streakDays: 10,
    skinTone: 'skin-warm',
    hairstyle: 'hair-explorer',
    hairColor: 'haircolor-espresso',
    outfit: 'outfit-jacket-atom',
    subjectXp: { chemistry: 170, physics: 205, biology: 100, mathematics: 245 },
    weeklyShareRatio: 0.5,
    achievementCodes: ['FIRST_STEPS', 'PROBLEM_SOLVER'],
  },
  {
    studentId: 'demo-student-mum-1',
    displayName: 'Zoya Khan',
    classGrade: '8',
    school: 'Jamnabai Narsee School',
    schoolLocation: 'Mumbai, Maharashtra',
    showSchoolOnLeaderboard: true,
    streakDays: 7,
    skinTone: 'skin-fair',
    hairstyle: 'hair-ponytail',
    hairColor: 'haircolor-cobalt',
    outfit: 'outfit-tunic-emerald',
    subjectXp: { chemistry: 195, physics: 130, biology: 215, mathematics: 155 },
    weeklyShareRatio: 0.65,
    achievementCodes: ['FIRST_STEPS', 'OPPORTUNITY_SEEKER'],
  },
  {
    studentId: 'demo-student-chn-1',
    displayName: 'Vikram Subramanian',
    classGrade: '9',
    school: 'PSBB Senior Secondary',
    schoolLocation: 'Chennai, Tamil Nadu',
    showSchoolOnLeaderboard: true,
    streakDays: 11,
    skinTone: 'skin-deep',
    hairstyle: 'hair-spiky',
    hairColor: 'haircolor-midnight',
    outfit: 'outfit-armor-royal',
    subjectXp: { chemistry: 160, physics: 230, biology: 135, mathematics: 260 },
    weeklyShareRatio: 0.35,
    achievementCodes: ['FIRST_STEPS', 'PROBLEM_SOLVER', 'INNOVATION_STAR'],
  },
];

let demoSeedPromise: Promise<void> | null = null;

/**
 * Idempotently seeds realistic demo students (including Bangalore schools)
 * so Global, School, Class, Subject, Weekly, and Monthly leaderboards have real DB data.
 */
export async function seedLeaderboardDemoStudents(): Promise<void> {
  if (!demoSeedPromise) {
    demoSeedPromise = (async () => {
      const existingDemoCount = await StudentProfileModel.countDocuments({
        studentId: { $in: DEMO_STUDENTS.map((s) => s.studentId) },
      });
      if (existingDemoCount >= DEMO_STUDENTS.length) {
        return;
      }

      const [subjects, missions, achievements] = await Promise.all([
        SubjectModel.find({ isActive: true }).select('_id slug').lean(),
        MissionModel.find({ isPublished: true }).select('_id subjectId mapId xpReward').lean(),
        AchievementModel.find({ isActive: true }).select('_id code').lean(),
      ]);

      const subjectBySlug = new Map(subjects.map((s) => [s.slug, s._id]));
      const achByCode = new Map(achievements.map((a) => [a.code, a._id]));
      const missionsBySubjectSlug = new Map<string, typeof missions>();

      const slugBySubjectId = new Map(subjects.map((s) => [s._id.toString(), s.slug]));
      for (const m of missions) {
        const slug = slugBySubjectId.get(m.subjectId.toString());
        if (!slug) continue;
        const list = missionsBySubjectSlug.get(slug) ?? [];
        list.push(m);
        missionsBySubjectSlug.set(slug, list);
      }

      const now = new Date();
      const recentWeekDate = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago (within week & month)
      const earlierMonthDate = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 10, 0, 0),
      );

      for (const stu of DEMO_STUDENTS) {
        const totalXp =
          stu.subjectXp.chemistry +
          stu.subjectXp.physics +
          stu.subjectXp.biology +
          stu.subjectXp.mathematics;
        const level = calculateLevelFromXp(totalXp);

        await Promise.all([
          StudentProfileModel.updateOne(
            { studentId: stu.studentId },
            {
              $setOnInsert: {
                studentId: stu.studentId,
                displayName: stu.displayName,
                classGrade: stu.classGrade,
                school: stu.school,
                schoolLocation: stu.schoolLocation,
                preferredLanguage: 'English',
                interests: ['Science', 'Mathematics'],
                leaderboardOptOut: false,
                showSchoolOnLeaderboard: stu.showSchoolOnLeaderboard,
              },
            },
            { upsert: true },
          ),
          PlayerProgressModel.updateOne(
            { userId: stu.studentId },
            {
              $setOnInsert: {
                userId: stu.studentId,
                totalXp,
                level,
                currentStreakDays: stu.streakDays,
                longestStreakDays: stu.streakDays + 2,
                lastActivityDate: recentWeekDate,
              },
            },
            { upsert: true },
          ),
          StudentAvatarModel.updateOne(
            { studentId: stu.studentId },
            {
              $setOnInsert: {
                studentId: stu.studentId,
                appearance: {
                  ...DEFAULT_AVATAR_APPEARANCE,
                  skinTone: stu.skinTone,
                  hairstyle: stu.hairstyle,
                  hairColor: stu.hairColor,
                  outfit: stu.outfit,
                },
                equippedItems: { ...DEFAULT_EQUIPPED_ITEMS },
                unlockedItemKeys: ['skin-warm', 'outfit-tunic-emerald'],
              },
            },
            { upsert: true },
          ),
        ]);

        // Seed XP transactions per subject (split between weekly and earlier in month)
        const txOps: Promise<unknown>[] = [];
        const missionOps: Promise<unknown>[] = [];

        for (const [slug, xpAmount] of Object.entries(stu.subjectXp) as Array<
          [keyof DemoStudentSeed['subjectXp'], number]
        >) {
          const subjectId = subjectBySlug.get(slug);
          const weeklyAmount = Math.round(xpAmount * stu.weeklyShareRatio);
          const earlierAmount = Math.max(0, xpAmount - weeklyAmount);

          if (weeklyAmount > 0) {
            const key = `demo-tx:${stu.studentId}:${slug}:weekly`;
            txOps.push(
              XPTransactionModel.updateOne(
                { idempotencyKey: key },
                {
                  $setOnInsert: {
                    userId: stu.studentId,
                    amount: weeklyAmount,
                    sourceType: 'node_completion',
                    sourceId: `demo-${slug}-weekly`,
                    subjectId,
                    subjectSlug: slug,
                    idempotencyKey: key,
                    description: `Completed ${slug} quest`,
                    createdAt: recentWeekDate,
                    updatedAt: recentWeekDate,
                  },
                },
                { upsert: true, timestamps: false },
              ),
            );
          }

          if (earlierAmount > 0) {
            const key = `demo-tx:${stu.studentId}:${slug}:month`;
            txOps.push(
              XPTransactionModel.updateOne(
                { idempotencyKey: key },
                {
                  $setOnInsert: {
                    userId: stu.studentId,
                    amount: earlierAmount,
                    sourceType: 'node_completion',
                    sourceId: `demo-${slug}-month`,
                    subjectId,
                    subjectSlug: slug,
                    idempotencyKey: key,
                    description: `Completed ${slug} foundation mission`,
                    createdAt: earlierMonthDate,
                    updatedAt: earlierMonthDate,
                  },
                },
                { upsert: true, timestamps: false },
              ),
            );
          }

          const subjMissions = missionsBySubjectSlug.get(slug) ?? [];
          if (subjMissions.length > 0) {
            const m = subjMissions[0];
            missionOps.push(
              StudentMissionProgressModel.updateOne(
                { studentId: stu.studentId, missionId: m._id },
                {
                  $setOnInsert: {
                    studentId: stu.studentId,
                    subjectId: m.subjectId,
                    mapId: m.mapId,
                    missionId: m._id,
                    status: 'COMPLETED',
                    attempts: 1,
                    bestScore: 95,
                    stars: 3,
                    startedAt: earlierMonthDate,
                    completedAt: recentWeekDate,
                    xpAwarded: m.xpReward,
                  },
                },
                { upsert: true, timestamps: false },
              ),
            );
          }
        }

        const achOps = stu.achievementCodes
          .map((code) => {
            const achId = achByCode.get(code);
            if (!achId) return null;
            return UserAchievementModel.updateOne(
              { userId: stu.studentId, achievementId: achId },
              {
                $setOnInsert: {
                  userId: stu.studentId,
                  achievementId: achId,
                  unlockedAt: recentWeekDate,
                  claimed: true,
                  claimedAt: recentWeekDate,
                },
              },
              { upsert: true },
            );
          })
          .filter((p): p is NonNullable<typeof p> => Boolean(p));

        await Promise.all([...txOps, ...missionOps, ...achOps]);
      }
    })().catch((err) => {
      demoSeedPromise = null;
      throw err;
    });
  }
  return demoSeedPromise;
}
