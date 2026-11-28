import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export type GameNodeType = 'lesson' | 'lab' | 'quiz' | 'boss';

export interface IGameNode extends Document {
  worldId: Types.ObjectId;
  slug: string;
  title: string;
  type: GameNodeType;
  order: number;
  xpReward: number;
  prerequisiteNodeIds: Types.ObjectId[];
  referenceId?: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const gameNodeSchema = new Schema<IGameNode>(
  {
    worldId: { type: Schema.Types.ObjectId, ref: 'GameWorld', required: true, index: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    title: { type: String, required: true, trim: true },
    type: { type: String, enum: ['lesson', 'lab', 'quiz', 'boss'], required: true },
    order: { type: Number, required: true, default: 0 },
    xpReward: { type: Number, required: true, min: 0, default: 50 },
    prerequisiteNodeIds: [{ type: Schema.Types.ObjectId, ref: 'GameNode' }],
    referenceId: { type: String, trim: true },
    isPublished: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);

gameNodeSchema.index({ worldId: 1, slug: 1 }, { unique: true });

export const GameNodeModel: Model<IGameNode> =
  (mongoose.models.GameNode as Model<IGameNode>) ||
  mongoose.model<IGameNode>('GameNode', gameNodeSchema);
