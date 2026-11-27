import mongoose, { Document, Model, Schema } from 'mongoose';
import { CodingLanguage } from './CodingTypes';

export type CodingSubmissionStatus =
  | 'ACCEPTED'
  | 'WRONG_ANSWER'
  | 'COMPILATION_ERROR'
  | 'RUNTIME_ERROR'
  | 'TIMEOUT'
  | 'PROVIDER_ERROR';

export interface ICodingSubmission extends Document {
  studentId: string;
  challengeId: string;
  levelId: string;
  language: CodingLanguage;
  status: CodingSubmissionStatus;
  passedTests: number;
  totalTests: number;
  executionMeta: {
    time?: string;
    memory?: string;
    exitCode?: number | null;
  };
  submittedAt: Date;
}

const codingSubmissionSchema = new Schema<ICodingSubmission>(
  {
    studentId: { type: String, required: true, index: true },
    challengeId: { type: String, required: true, index: true },
    levelId: { type: String, required: true, index: true },
    language: {
      type: String,
      enum: ['python', 'javascript', 'java'],
      required: true,
    },
    status: {
      type: String,
      enum: [
        'ACCEPTED',
        'WRONG_ANSWER',
        'COMPILATION_ERROR',
        'RUNTIME_ERROR',
        'TIMEOUT',
        'PROVIDER_ERROR',
      ],
      required: true,
    },
    passedTests: { type: Number, required: true, min: 0 },
    totalTests: { type: Number, required: true, min: 1 },
    executionMeta: {
      time: { type: String },
      memory: { type: String },
      exitCode: { type: Number, default: null },
    },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

codingSubmissionSchema.index({ studentId: 1, challengeId: 1, submittedAt: -1 });

export const CodingSubmissionModel: Model<ICodingSubmission> =
  (mongoose.models.CodingSubmission as Model<ICodingSubmission>) ||
  mongoose.model<ICodingSubmission>('CodingSubmission', codingSubmissionSchema);
