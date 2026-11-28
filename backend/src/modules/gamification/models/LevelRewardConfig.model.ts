import mongoose, { Document, Model, Schema } from 'mongoose';

export type LevelRewardType = 'clothing' | 'xp_only' | 'conqueror';

export interface ILevelRewardConfig extends Document {
  missionSlug: string;
  subjectSlug: string;
  sequence: number;
  rewardItemKeys: string[];
  rewardXp: number;
  rewardType: LevelRewardType;
  isRewardEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const levelRewardConfigSchema = new Schema<ILevelRewardConfig>(
  {
    missionSlug: { type: String, required: true, unique: true, trim: true, index: true },
    subjectSlug: { type: String, required: true, trim: true, lowercase: true, index: true },
    sequence: { type: Number, required: true, min: 1 },
    rewardItemKeys: { type: [String], default: [] },
    rewardXp: { type: Number, required: true, min: 0, default: 0 },
    rewardType: {
      type: String,
      enum: ['clothing', 'xp_only', 'conqueror'],
      required: true,
      default: 'clothing',
    },
    isRewardEnabled: { type: Boolean, required: true, default: true },
  },
  { timestamps: true },
);

export const LevelRewardConfigModel: Model<ILevelRewardConfig> =
  (mongoose.models.LevelRewardConfig as Model<ILevelRewardConfig>) ||
  mongoose.model<ILevelRewardConfig>('LevelRewardConfig', levelRewardConfigSchema);
