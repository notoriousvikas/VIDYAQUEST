import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ILevelRewardClaim extends Document {
  studentId: string;
  missionId: string;
  missionSlug: string;
  subjectSlug: string;
  rewardItemKeys: string[];
  rewardXp: number;
  claimedAt: Date;
}

const levelRewardClaimSchema = new Schema<ILevelRewardClaim>(
  {
    studentId: { type: String, required: true, index: true },
    missionId: { type: String, required: true },
    missionSlug: { type: String, required: true },
    subjectSlug: { type: String, required: true },
    rewardItemKeys: { type: [String], default: [] },
    rewardXp: { type: Number, required: true, default: 0 },
    claimedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true },
);

levelRewardClaimSchema.index({ studentId: 1, missionId: 1 }, { unique: true });

export const LevelRewardClaimModel: Model<ILevelRewardClaim> =
  (mongoose.models.LevelRewardClaim as Model<ILevelRewardClaim>) ||
  mongoose.model<ILevelRewardClaim>('LevelRewardClaim', levelRewardClaimSchema);
