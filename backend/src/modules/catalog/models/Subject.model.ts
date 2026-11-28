import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISubject extends Document {
  name: string;
  slug: string;
  description: string;
  icon: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const subjectSchema = new Schema<ISubject>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    description: { type: String, required: true, default: '' },
    icon: { type: String, required: true, default: 'compass' },
    displayOrder: { type: Number, required: true, default: 0 },
    isActive: { type: Boolean, required: true, default: true, index: true },
  },
  { timestamps: true },
);

export const SubjectModel: Model<ISubject> =
  (mongoose.models.Subject as Model<ISubject>) ||
  mongoose.model<ISubject>('Subject', subjectSchema);
