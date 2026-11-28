import mongoose, { Document, Model, Schema } from 'mongoose';

export type EligibleLearningActivityType =
  | 'lesson'
  | 'quiz'
  | 'chapter'
  | 'virtual_lab'
  | 'challenge';

export type DailyStreakDayStatus = 'completed' | 'freeze_used';

export interface DailyActivityEntry {
  activityType: EligibleLearningActivityType;
  activityId: string;
  title?: string;
  completedAt: Date;
}

export interface IDailyLearningActivity extends Document {
  studentId: string;
  dateKey: string;
  status: DailyStreakDayStatus;
  activities: DailyActivityEntry[];
  xpAwarded: number;
  createdAt: Date;
  updatedAt: Date;
}

const dailyLearningActivitySchema = new Schema<IDailyLearningActivity>(
  {
    studentId: { type: String, required: true, index: true },
    dateKey: { type: String, required: true },
    status: {
      type: String,
      enum: ['completed', 'freeze_used'],
      required: true,
      default: 'completed',
    },
    activities: [
      {
        activityType: {
          type: String,
          enum: ['lesson', 'quiz', 'chapter', 'virtual_lab', 'challenge'],
          required: true,
        },
        activityId: { type: String, required: true },
        title: { type: String, trim: true },
        completedAt: { type: Date, required: true, default: Date.now },
      },
    ],
    xpAwarded: { type: Number, required: true, min: 0, default: 0 },
  },
  { timestamps: true },
);

dailyLearningActivitySchema.index({ studentId: 1, dateKey: 1 }, { unique: true });

export const DailyLearningActivityModel: Model<IDailyLearningActivity> =
  (mongoose.models.DailyLearningActivity as Model<IDailyLearningActivity>) ||
  mongoose.model<IDailyLearningActivity>('DailyLearningActivity', dailyLearningActivitySchema);
