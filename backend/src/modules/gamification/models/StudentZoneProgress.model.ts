import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export type StudentZoneStatus = 'LOCKED' | 'UNLOCKED' | 'COMPLETED';

export interface IStudentZoneProgress extends Document {
  studentId: string;
  subjectId: Types.ObjectId;
  mapId: Types.ObjectId;
  locationId: Types.ObjectId;
  status: StudentZoneStatus;
  completedMissions: number;
  unlockedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const studentZoneProgressSchema = new Schema<IStudentZoneProgress>(
  {
    studentId: { type: String, required: true, index: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
    mapId: { type: Schema.Types.ObjectId, ref: 'SubjectMap', required: true, index: true },
    locationId: { type: Schema.Types.ObjectId, ref: 'MapLocation', required: true },
    status: {
      type: String,
      enum: ['LOCKED', 'UNLOCKED', 'COMPLETED'],
      required: true,
      default: 'UNLOCKED',
    },
    completedMissions: { type: Number, required: true, min: 0, default: 0 },
    unlockedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true },
);

studentZoneProgressSchema.index({ studentId: 1, locationId: 1 }, { unique: true });
studentZoneProgressSchema.index({ studentId: 1, mapId: 1 });

export const StudentZoneProgressModel: Model<IStudentZoneProgress> =
  (mongoose.models.StudentZoneProgress as Model<IStudentZoneProgress>) ||
  mongoose.model<IStudentZoneProgress>('StudentZoneProgress', studentZoneProgressSchema);
