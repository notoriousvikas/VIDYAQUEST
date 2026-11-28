import mongoose, { Document, Model, Schema } from 'mongoose';

export type StudentActivityType =
  | 'mission_started'
  | 'mission_completed'
  | 'xp_earned'
  | 'level_up'
  | 'achievement_unlocked'
  | 'avatar_unlocked'
  | 'avatar_updated'
  | 'daily_quest_completed'
  | 'profile_updated'
  | 'streak_milestone'
  | 'streak_freeze_used'
  | 'subject_conquered';

export interface IStudentActivity extends Document {
  studentId: string;
  activityType: StudentActivityType;
  description: string;
  referenceId?: string;
  xpDelta?: number;
  createdAt: Date;
  updatedAt: Date;
}

const studentActivitySchema = new Schema<IStudentActivity>(
  {
    studentId: { type: String, required: true, index: true },
    activityType: {
      type: String,
      enum: [
        'mission_started',
        'mission_completed',
        'xp_earned',
        'level_up',
        'achievement_unlocked',
        'avatar_unlocked',
        'avatar_updated',
        'daily_quest_completed',
        'profile_updated',
        'streak_milestone',
        'streak_freeze_used',
        'subject_conquered',
      ],
      required: true,
    },
    description: { type: String, required: true, trim: true },
    referenceId: { type: String, trim: true },
    xpDelta: { type: Number },
  },
  { timestamps: true },
);

studentActivitySchema.index({ studentId: 1, createdAt: -1 });

export const StudentActivityModel: Model<IStudentActivity> =
  (mongoose.models.StudentActivity as Model<IStudentActivity>) ||
  mongoose.model<IStudentActivity>('StudentActivity', studentActivitySchema);
