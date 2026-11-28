import mongoose, { Document, Model, Schema } from 'mongoose';
import { AvatarAppearanceConfig, AvatarEquippedItemsConfig } from './StudentAvatar.model';

export interface ISavedOutfit extends Document {
  studentId: string;
  outfitName: string;
  appearance: AvatarAppearanceConfig;
  equippedItems: AvatarEquippedItemsConfig;
  createdAt: Date;
  updatedAt: Date;
}

const savedOutfitSchema = new Schema<ISavedOutfit>(
  {
    studentId: { type: String, required: true, index: true },
    outfitName: { type: String, required: true, trim: true, maxlength: 50 },
    appearance: { type: Schema.Types.Mixed, required: true },
    equippedItems: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true },
);

savedOutfitSchema.index({ studentId: 1, createdAt: -1 });

export const SavedOutfitModel: Model<ISavedOutfit> =
  (mongoose.models.SavedOutfit as Model<ISavedOutfit>) ||
  mongoose.model<ISavedOutfit>('SavedOutfit', savedOutfitSchema);
