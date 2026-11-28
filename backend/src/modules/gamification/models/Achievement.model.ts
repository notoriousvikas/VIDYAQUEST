import mongoose, { Document, Model, Schema } from 'mongoose';

export type AchievementCategory = 'exploration' | 'mastery' | 'streak' | 'lab';

export interface IAchievement extends Document {
  code: string;
  title: string;
  description: string;
  category: AchievementCategory;
  xpBonus: number;
  iconUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const achievementSchema = new Schema<IAchievement>(
  {
    code: { type: String, required: true, unique: true, trim: true, uppercase: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['exploration', 'mastery', 'streak', 'lab'],
      required: true,
    },
    xpBonus: { type: Number, required: true, min: 0, default: 25 },
    iconUrl: { type: String, trim: true },
    isActive: { type: Boolean, required: true, default: true },
  },
  { timestamps: true },
);

export const AchievementModel: Model<IAchievement> =
  (mongoose.models.Achievement as Model<IAchievement>) ||
  mongoose.model<IAchievement>('Achievement', achievementSchema);
