import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface IUserAchievement extends Document {
  userId: string;
  achievementId: Types.ObjectId;
  unlockedAt: Date;
  claimed: boolean;
  claimedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userAchievementSchema = new Schema<IUserAchievement>(
  {
    userId: { type: String, required: true, index: true },
    achievementId: { type: Schema.Types.ObjectId, ref: 'Achievement', required: true },
    unlockedAt: { type: Date, required: true, default: Date.now },
    claimed: { type: Boolean, required: true, default: false },
    claimedAt: { type: Date },
  },
  { timestamps: true },
);

userAchievementSchema.index({ userId: 1, achievementId: 1 }, { unique: true });

export const UserAchievementModel: Model<IUserAchievement> =
  (mongoose.models.UserAchievement as Model<IUserAchievement>) ||
  mongoose.model<IUserAchievement>('UserAchievement', userAchievementSchema);
