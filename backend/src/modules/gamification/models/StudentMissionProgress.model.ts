import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export type StudentMissionStatus = 'LOCKED' | 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED';

export interface IStudentMissionProgress extends Document {
  studentId: string;
  subjectId: Types.ObjectId;
  mapId: Types.ObjectId;
  missionId: Types.ObjectId;
  status: StudentMissionStatus;
  attempts: number;
  bestScore: number;
  stars: 0 | 1 | 2 | 3;
  startedAt?: Date;
  completedAt?: Date;
  xpAwarded: number;
  createdAt: Date;
  updatedAt: Date;
}

const studentMissionProgressSchema = new Schema<IStudentMissionProgress>(
  {
    studentId: { type: String, required: true, index: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
    mapId: { type: Schema.Types.ObjectId, ref: 'SubjectMap', required: true, index: true },
    missionId: { type: Schema.Types.ObjectId, ref: 'Mission', required: true },
    status: {
      type: String,
      enum: ['LOCKED', 'AVAILABLE', 'IN_PROGRESS', 'COMPLETED'],
      required: true,
      default: 'AVAILABLE',
    },
    attempts: { type: Number, required: true, min: 0, default: 0 },
    bestScore: { type: Number, required: true, min: 0, max: 100, default: 0 },
    stars: { type: Number, enum: [0, 1, 2, 3], required: true, default: 0 },
    startedAt: { type: Date },
    completedAt: { type: Date },
    xpAwarded: { type: Number, required: true, min: 0, default: 0 },
  },
  { timestamps: true },
);

studentMissionProgressSchema.index({ studentId: 1, missionId: 1 }, { unique: true });
studentMissionProgressSchema.index({ studentId: 1, mapId: 1 });

export const StudentMissionProgressModel: Model<IStudentMissionProgress> =
  (mongoose.models.StudentMissionProgress as Model<IStudentMissionProgress>) ||
  mongoose.model<IStudentMissionProgress>(
    'StudentMissionProgress',
    studentMissionProgressSchema,
  );
