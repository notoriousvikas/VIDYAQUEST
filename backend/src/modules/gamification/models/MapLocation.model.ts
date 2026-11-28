import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface IMapLocation extends Document {
  mapId: Types.ObjectId;
  name: string;
  slug: string;
  locationType: string;
  positionX: number;
  positionY: number;
  assetReference?: string;
  accentColor: string;
  displayOrder: number;
  description: string;
  unlockRequirements: Types.ObjectId[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const mapLocationSchema = new Schema<IMapLocation>(
  {
    mapId: { type: Schema.Types.ObjectId, ref: 'SubjectMap', required: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    locationType: { type: String, required: true, default: 'zone' },
    positionX: { type: Number, required: true, min: 0, max: 100 },
    positionY: { type: Number, required: true, min: 0, max: 100 },
    assetReference: { type: String, trim: true },
    accentColor: { type: String, required: true, default: '#eab308' },
    displayOrder: { type: Number, required: true, default: 0 },
    description: { type: String, required: true, default: '' },
    unlockRequirements: [{ type: Schema.Types.ObjectId, ref: 'MapLocation' }],
    isActive: { type: Boolean, required: true, default: true },
  },
  { timestamps: true },
);

mapLocationSchema.index({ mapId: 1, slug: 1 }, { unique: true });
mapLocationSchema.index({ mapId: 1, displayOrder: 1 });

export const MapLocationModel: Model<IMapLocation> =
  (mongoose.models.MapLocation as Model<IMapLocation>) ||
  mongoose.model<IMapLocation>('MapLocation', mapLocationSchema);
