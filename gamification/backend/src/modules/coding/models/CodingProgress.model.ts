import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ICodingProgress extends Document {
  studentId: string;
  levelId: string;
  missionSlug: string;
  completedChallengeIds: string[];
  completedByLanguage: {
    python: string[];
    javascript: string[];
    java: string[];
  };
  levelBonusAwarded: boolean;
  completedAt?: Date;
}

const codingProgressSchema = new Schema<ICodingProgress>(
  {
    studentId: { type: String, required: true, index: true },
    levelId: { type: String, required: true, index: true },
    missionSlug: { type: String, required: true },
    completedChallengeIds: { type: [String], default: [] },
    completedByLanguage: {
      python: { type: [String], default: [] },
      javascript: { type: [String], default: [] },
      java: { type: [String], default: [] },
    },
    levelBonusAwarded: { type: Boolean, default: false },
    completedAt: { type: Date },
  },
  { timestamps: true },
);

codingProgressSchema.index({ studentId: 1, levelId: 1 }, { unique: true });

export const CodingProgressModel: Model<ICodingProgress> =
  (mongoose.models.CodingProgress as Model<ICodingProgress>) ||
  mongoose.model<ICodingProgress>('CodingProgress', codingProgressSchema);
