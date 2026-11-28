import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IDailyQuestProgress extends Document {
  studentId: string;
  dateKey: string;
  questKey: string;
  title: string;
  description: string;
  targetCount: number;
  currentCount: number;
  xpReward: number;
  completed: boolean;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const dailyQuestProgressSchema = new Schema<IDailyQuestProgress>(
  {
    studentId: { type: String, required: true, index: true },
    dateKey: { type: String, required: true },
    questKey: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    targetCount: { type: Number, required: true, min: 1, default: 1 },
    currentCount: { type: Number, required: true, min: 0, default: 0 },
    xpReward: { type: Number, required: true, min: 0, default: 40 },
    completed: { type: Boolean, required: true, default: false },
    completedAt: { type: Date },
  },
  { timestamps: true },
);

dailyQuestProgressSchema.index({ studentId: 1, dateKey: 1 }, { unique: true });

export const DailyQuestProgressModel: Model<IDailyQuestProgress> =
  (mongoose.models.DailyQuestProgress as Model<IDailyQuestProgress>) ||
  mongoose.model<IDailyQuestProgress>('DailyQuestProgress', dailyQuestProgressSchema);
