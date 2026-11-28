import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface SubjectMapTheme {
  primaryColor: string;
  secondaryColor: string;
  oceanColor: string;
  badgeStyle: string;
  ambientEffect: string;
}

export interface SubjectMapConfiguration {
  width: number;
  height: number;
  minScale: number;
  maxScale: number;
  defaultCenterX: number;
  defaultCenterY: number;
}

export interface ISubjectMap extends Document {
  subjectId: Types.ObjectId;
  mapName: string;
  mapSlug: string;
  theme: SubjectMapTheme;
  backgroundAsset: string;
  previewAsset: string;
  mapConfiguration: SubjectMapConfiguration;
  isPublished: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const subjectMapSchema = new Schema<ISubjectMap>(
  {
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
    mapName: { type: String, required: true, trim: true },
    mapSlug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    theme: {
      primaryColor: { type: String, required: true, default: '#eab308' },
      secondaryColor: { type: String, required: true, default: '#22c55e' },
      oceanColor: { type: String, required: true, default: '#1b5e7a' },
      badgeStyle: { type: String, required: true, default: 'rpg-gold' },
      ambientEffect: { type: String, required: true, default: 'clouds' },
    },
    backgroundAsset: { type: String, required: true },
    previewAsset: { type: String, required: true },
    mapConfiguration: {
      width: { type: Number, required: true, default: 1600 },
      height: { type: Number, required: true, default: 960 },
      minScale: { type: Number, required: true, default: 0.7 },
      maxScale: { type: Number, required: true, default: 2.5 },
      defaultCenterX: { type: Number, required: true, default: 50 },
      defaultCenterY: { type: Number, required: true, default: 50 },
    },
    isPublished: { type: Boolean, required: true, default: false, index: true },
    version: { type: Number, required: true, default: 1 },
  },
  { timestamps: true },
);

subjectMapSchema.index({ subjectId: 1, isPublished: 1, version: -1 });

export const SubjectMapModel: Model<ISubjectMap> =
  (mongoose.models.SubjectMap as Model<ISubjectMap>) ||
  mongoose.model<ISubjectMap>('SubjectMap', subjectMapSchema);
