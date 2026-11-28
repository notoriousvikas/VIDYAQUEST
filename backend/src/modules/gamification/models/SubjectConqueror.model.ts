import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISubjectConqueror extends Document {
  studentId: string;
  subjectSlug: string;
  subjectName: string;
  mapName: string;
  titleAwarded: string;
  crownItemKey: string;
  unlockedItemKeys: string[];
  xpBonusAwarded: number;
  achievementCode: string;
  conqueredAt: Date;
}

const subjectConquerorSchema = new Schema<ISubjectConqueror>(
  {
    studentId: { type: String, required: true, index: true },
    subjectSlug: { type: String, required: true, lowercase: true, trim: true },
    subjectName: { type: String, required: true, trim: true },
    mapName: { type: String, required: true, trim: true },
    titleAwarded: { type: String, required: true, trim: true },
    crownItemKey: { type: String, required: true, trim: true },
    unlockedItemKeys: { type: [String], default: [] },
    xpBonusAwarded: { type: Number, required: true, default: 300 },
    achievementCode: { type: String, required: true, trim: true },
    conqueredAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true },
);

subjectConquerorSchema.index({ studentId: 1, subjectSlug: 1 }, { unique: true });

export const SubjectConquerorModel: Model<ISubjectConqueror> =
  (mongoose.models.SubjectConqueror as Model<ISubjectConqueror>) ||
  mongoose.model<ISubjectConqueror>('SubjectConqueror', subjectConquerorSchema);
