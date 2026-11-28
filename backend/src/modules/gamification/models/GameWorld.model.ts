import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IGameWorld extends Document {
  slug: string;
  title: string;
  description: string;
  subject: string;
  order: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const gameWorldSchema = new Schema<IGameWorld>(
  {
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, default: '' },
    subject: { type: String, required: true, trim: true },
    order: { type: Number, required: true, default: 0 },
    isPublished: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);

export const GameWorldModel: Model<IGameWorld> =
  (mongoose.models.GameWorld as Model<IGameWorld>) ||
  mongoose.model<IGameWorld>('GameWorld', gameWorldSchema);
