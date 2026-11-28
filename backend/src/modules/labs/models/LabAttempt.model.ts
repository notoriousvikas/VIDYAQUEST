import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export type LabAttemptStatus = 'IN_PROGRESS' | 'COMPLETED';

export interface ILabAttempt extends Document {
  studentId: Types.ObjectId;
  labId: string;
  missionId: Types.ObjectId;
  status: LabAttemptStatus;
  completedSteps: number[];
  observations: string[];
  answers: Record<string, number>;
  score: number;
  xpAwarded: number;
  startedAt: Date;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const labAttemptSchema = new Schema<ILabAttempt>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    labId: { type: String, required: true, trim: true, index: true },
    missionId: { type: Schema.Types.ObjectId, ref: 'Mission', required: true, index: true },
    status: {
      type: String,
      enum: ['IN_PROGRESS', 'COMPLETED'],
      required: true,
      default: 'IN_PROGRESS',
    },
    completedSteps: [{ type: Number }],
    observations: [{ type: String, trim: true }],
    answers: { type: Schema.Types.Mixed, default: {} },
    score: { type: Number, min: 0, max: 100, default: 0 },
    xpAwarded: { type: Number, min: 0, default: 0 },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

labAttemptSchema.index({ studentId: 1, labId: 1, missionId: 1 }, { unique: true });

export const LabAttemptModel: Model<ILabAttempt> =
  (mongoose.models.LabAttempt as Model<ILabAttempt>) ||
  mongoose.model<ILabAttempt>('LabAttempt', labAttemptSchema);
