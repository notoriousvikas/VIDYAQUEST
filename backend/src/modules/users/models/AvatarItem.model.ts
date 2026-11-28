import mongoose, { Document, Model, Schema } from 'mongoose';

export type AvatarItemCategory =
  | 'skinTone'
  | 'hairstyle'
  | 'hairColor'
  | 'face'
  | 'eyes'
  | 'outfit'
  | 'jacket'
  | 'bottoms'
  | 'shoes'
  | 'costume'
  | 'headwear'
  | 'glasses'
  | 'backpack'
  | 'cape'
  | 'aura'
  | 'neckwear'
  | 'wristwear'
  | 'badge'
  | 'accessory';

export type AvatarUnlockType =
  | 'free'
  | 'level'
  | 'xp'
  | 'achievement'
  | 'milestone'
  | 'streak'
  | 'quest_level';
export type AvatarItemRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface IAvatarItem extends Document {
  itemKey: string;
  name: string;
  category: AvatarItemCategory;
  subCategory?: string;
  assetReference: string;
  description: string;
  subjectSlug?: string;
  rarity: AvatarItemRarity;
  unlockType: AvatarUnlockType;
  unlockRequirement: {
    minLevel?: number;
    minXp?: number;
    minStreakDays?: number;
    achievementCode?: string;
    minMissions?: number;
    subjectSlug?: string;
    missionSlug?: string;
    missionSequence?: number;
    label: string;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const avatarItemSchema = new Schema<IAvatarItem>(
  {
    itemKey: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: [
        'skinTone',
        'hairstyle',
        'hairColor',
        'face',
        'eyes',
        'outfit',
        'jacket',
        'bottoms',
        'shoes',
        'costume',
        'headwear',
        'glasses',
        'backpack',
        'cape',
        'aura',
        'neckwear',
        'wristwear',
        'badge',
        'accessory',
      ],
      required: true,
      index: true,
    },
    subCategory: { type: String, trim: true },
    assetReference: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    subjectSlug: { type: String, trim: true, lowercase: true, index: true },
    rarity: {
      type: String,
      enum: ['common', 'rare', 'epic', 'legendary'],
      required: true,
      default: 'common',
    },
    unlockType: {
      type: String,
      enum: ['free', 'level', 'xp', 'achievement', 'milestone', 'streak', 'quest_level'],
      required: true,
      default: 'free',
    },
    unlockRequirement: {
      minLevel: { type: Number },
      minXp: { type: Number },
      minStreakDays: { type: Number },
      achievementCode: { type: String },
      minMissions: { type: Number },
      subjectSlug: { type: String },
      missionSlug: { type: String },
      missionSequence: { type: Number },
      label: { type: String, required: true, default: 'Starter Item' },
    },
    isActive: { type: Boolean, required: true, default: true },
  },
  { timestamps: true },
);

export const AvatarItemModel: Model<IAvatarItem> =
  (mongoose.models.AvatarItem as Model<IAvatarItem>) ||
  mongoose.model<IAvatarItem>('AvatarItem', avatarItemSchema);
