import mongoose, { Document, Model, Schema } from 'mongoose';
import { EligibleLearningActivityType } from './DailyLearningActivity.model';

export interface ILearningActivityReceipt extends Document {
  studentId: string;
  activityKey: string;
  activityType: EligibleLearningActivityType;
  activityId: string;
  dateKey: string;
  createdAt: Date;
}

const learningActivityReceiptSchema = new Schema<ILearningActivityReceipt>(
  {
    studentId: { type: String, required: true, index: true },
    activityKey: { type: String, required: true },
    activityType: {
      type: String,
      enum: ['lesson', 'quiz', 'chapter', 'virtual_lab', 'challenge'],
      required: true,
    },
    activityId: { type: String, required: true },
    dateKey: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

learningActivityReceiptSchema.index({ studentId: 1, activityKey: 1 }, { unique: true });

export const LearningActivityReceiptModel: Model<ILearningActivityReceipt> =
  (mongoose.models.LearningActivityReceipt as Model<ILearningActivityReceipt>) ||
  mongoose.model<ILearningActivityReceipt>('LearningActivityReceipt', learningActivityReceiptSchema);
