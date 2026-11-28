import mongoose, { Document, Model, Schema } from 'mongoose';

export interface AvatarAppearanceConfig {
  skinTone: string;
  hairstyle: string;
  hairColor: string;
  face: string;
  eyes: string;
  outfit: string;
  jacket: string;
  bottoms: string;
  shoes: string;
  costume: string;
}

export interface AvatarEquippedItemsConfig {
  headwear: string;
  glasses: string;
  backpack: string;
  cape: string;
  aura: string;
  neckwear: string;
  wristwear: string;
  badge: string;
  accessory: string;
}

export interface IStudentAvatar extends Document {
  studentId: string;
  appearance: AvatarAppearanceConfig;
  equippedItems: AvatarEquippedItemsConfig;
  unlockedItemKeys: string[];
  activeOutfitId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const DEFAULT_AVATAR_APPEARANCE: AvatarAppearanceConfig = {
  skinTone: 'skin-warm',
  hairstyle: 'hair-explorer',
  hairColor: 'haircolor-espresso',
  face: 'face-smile',
  eyes: 'eyes-bright',
  outfit: 'outfit-tunic-emerald',
  jacket: 'jacket-none',
  bottoms: 'bottoms-explorer-pants',
  shoes: 'shoes-boots-brown',
  costume: 'costume-none',
};

export const DEFAULT_EQUIPPED_ITEMS: AvatarEquippedItemsConfig = {
  headwear: 'headwear-none',
  glasses: 'glasses-none',
  backpack: 'backpack-canvas',
  cape: 'cape-none',
  aura: 'aura-none',
  neckwear: 'neckwear-none',
  wristwear: 'wristwear-none',
  badge: 'badge-none',
  accessory: 'accessory-none',
};

const studentAvatarSchema = new Schema<IStudentAvatar>(
  {
    studentId: { type: String, required: true, unique: true, index: true },
    appearance: {
      skinTone: { type: String, required: true, default: DEFAULT_AVATAR_APPEARANCE.skinTone },
      hairstyle: { type: String, required: true, default: DEFAULT_AVATAR_APPEARANCE.hairstyle },
      hairColor: { type: String, required: true, default: DEFAULT_AVATAR_APPEARANCE.hairColor },
      face: { type: String, required: true, default: DEFAULT_AVATAR_APPEARANCE.face },
      eyes: { type: String, required: true, default: DEFAULT_AVATAR_APPEARANCE.eyes },
      outfit: { type: String, required: true, default: DEFAULT_AVATAR_APPEARANCE.outfit },
      jacket: { type: String, required: true, default: DEFAULT_AVATAR_APPEARANCE.jacket },
      bottoms: { type: String, required: true, default: DEFAULT_AVATAR_APPEARANCE.bottoms },
      shoes: { type: String, required: true, default: DEFAULT_AVATAR_APPEARANCE.shoes },
      costume: { type: String, required: true, default: DEFAULT_AVATAR_APPEARANCE.costume },
    },
    equippedItems: {
      headwear: { type: String, required: true, default: DEFAULT_EQUIPPED_ITEMS.headwear },
      glasses: { type: String, required: true, default: DEFAULT_EQUIPPED_ITEMS.glasses },
      backpack: { type: String, required: true, default: DEFAULT_EQUIPPED_ITEMS.backpack },
      cape: { type: String, required: true, default: DEFAULT_EQUIPPED_ITEMS.cape },
      aura: { type: String, required: true, default: DEFAULT_EQUIPPED_ITEMS.aura },
      neckwear: { type: String, required: true, default: DEFAULT_EQUIPPED_ITEMS.neckwear },
      wristwear: { type: String, required: true, default: DEFAULT_EQUIPPED_ITEMS.wristwear },
      badge: { type: String, required: true, default: DEFAULT_EQUIPPED_ITEMS.badge },
      accessory: { type: String, required: true, default: DEFAULT_EQUIPPED_ITEMS.accessory },
    },
    unlockedItemKeys: { type: [String], default: [] },
    activeOutfitId: { type: String, default: null },
  },
  { timestamps: true },
);

export const StudentAvatarModel: Model<IStudentAvatar> =
  (mongoose.models.StudentAvatar as Model<IStudentAvatar>) ||
  mongoose.model<IStudentAvatar>('StudentAvatar', studentAvatarSchema);
