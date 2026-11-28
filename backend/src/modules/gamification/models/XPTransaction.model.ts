import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export type XPSourceType = 'node_completion' | 'mission' | 'achievement' | 'streak_bonus' | 'manual';

export interface IXPTransaction extends Document {
  userId: string;
  amount: number;
  sourceType: XPSourceType;
  sourceId?: string;
  subjectId?: Types.ObjectId;
  subjectSlug?: string;
  idempotencyKey?: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const xpTransactionSchema = new Schema<IXPTransaction>(
  {
    userId: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    sourceType: {
      type: String,
      enum: ['node_completion', 'mission', 'achievement', 'streak_bonus', 'manual'],
      required: true,
    },
    sourceId: { type: String, trim: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', index: true },
    subjectSlug: { type: String, trim: true, lowercase: true, index: true },
    idempotencyKey: { type: String, trim: true },
    description: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

xpTransactionSchema.index({ userId: 1, createdAt: -1 });
xpTransactionSchema.index({ createdAt: -1, userId: 1 });
xpTransactionSchema.index({ subjectSlug: 1, createdAt: -1 });
xpTransactionSchema.index({ subjectId: 1, createdAt: -1 });
xpTransactionSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });

export const XPTransactionModel: Model<IXPTransaction> =
  (mongoose.models.XPTransaction as Model<IXPTransaction>) ||
  mongoose.model<IXPTransaction>('XPTransaction', xpTransactionSchema);
