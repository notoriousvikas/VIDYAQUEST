import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IStudentStreak extends Document {
  studentId: string;
  currentStreakDays: number;
  longestStreakDays: number;
  totalActiveDays: number;
  lastActiveDateKey: string | null;
  availableFreezes: number;
  totalFreezesEarned: number;
  totalFreezesUsed: number;
  lastFreezeUsedDateKey: string | null;
  claimedMilestones: number[];
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

const studentStreakSchema = new Schema<IStudentStreak>(
  {
    studentId: { type: String, required: true, unique: true, index: true },
    currentStreakDays: { type: Number, required: true, min: 0, default: 0 },
    longestStreakDays: { type: Number, required: true, min: 0, default: 0 },
    totalActiveDays: { type: Number, required: true, min: 0, default: 0 },
    lastActiveDateKey: { type: String, default: null },
    availableFreezes: { type: Number, required: true, min: 0, default: 1 },
    totalFreezesEarned: { type: Number, required: true, min: 0, default: 1 },
    totalFreezesUsed: { type: Number, required: true, min: 0, default: 0 },
    lastFreezeUsedDateKey: { type: String, default: null },
    claimedMilestones: { type: [Number], default: [] },
    timezone: { type: String, required: true, default: 'UTC', maxlength: 64 },
  },
  { timestamps: true },
);

export const StudentStreakModel: Model<IStudentStreak> =
  (mongoose.models.StudentStreak as Model<IStudentStreak>) ||
  mongoose.model<IStudentStreak>('StudentStreak', studentStreakSchema);
