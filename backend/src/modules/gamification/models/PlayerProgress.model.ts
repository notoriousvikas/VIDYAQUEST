import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface IPlayerProgress extends Document {
  userId: string;
  totalXp: number;
  level: number;
  currentStreakDays: number;
  longestStreakDays: number;
  lastActivityDate?: Date;
  unlockedNodeIds: Types.ObjectId[];
  completedNodeIds: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const playerProgressSchema = new Schema<IPlayerProgress>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    totalXp: { type: Number, required: true, min: 0, default: 0 },
    level: { type: Number, required: true, min: 1, default: 1 },
    currentStreakDays: { type: Number, required: true, min: 0, default: 0 },
    longestStreakDays: { type: Number, required: true, min: 0, default: 0 },
    lastActivityDate: { type: Date },
    unlockedNodeIds: [{ type: Schema.Types.ObjectId, ref: 'GameNode' }],
    completedNodeIds: [{ type: Schema.Types.ObjectId, ref: 'GameNode' }],
  },
  { timestamps: true },
);

playerProgressSchema.index({ totalXp: -1, updatedAt: 1 });

export const PlayerProgressModel: Model<IPlayerProgress> =
  (mongoose.models.PlayerProgress as Model<IPlayerProgress>) ||
  mongoose.model<IPlayerProgress>('PlayerProgress', playerProgressSchema);
