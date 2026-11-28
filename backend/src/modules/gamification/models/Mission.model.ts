import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export type MissionType =
  | 'Quiz'
  | 'Interactive lesson'
  | 'Virtual experiment'
  | 'Puzzle'
  | 'Project'
  | 'Challenge';

export type MissionDifficulty = 'Beginner' | 'Intermediate' | 'Advanced' | 'Master';

export interface IMission extends Document {
  subjectId: Types.ObjectId;
  mapId: Types.ObjectId;
  locationId: Types.ObjectId;
  slug: string;
  title: string;
  description: string;
  missionType: MissionType;
  difficulty: MissionDifficulty;
  xpReward: number;
  prerequisites: Types.ObjectId[];
  sequence: number;
  gradeEligibility: string[];
  estimatedDurationMinutes: number;
  learningObjectives: string[];
  contentReference?: string;
  positionX: number;
  positionY: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const missionSchema = new Schema<IMission>(
  {
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
    mapId: { type: Schema.Types.ObjectId, ref: 'SubjectMap', required: true, index: true },
    locationId: { type: Schema.Types.ObjectId, ref: 'MapLocation', required: true, index: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, default: '' },
    missionType: {
      type: String,
      enum: ['Quiz', 'Interactive lesson', 'Virtual experiment', 'Puzzle', 'Project', 'Challenge'],
      required: true,
      default: 'Interactive lesson',
    },
    difficulty: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Master'],
      required: true,
      default: 'Beginner',
    },
    xpReward: { type: Number, required: true, min: 0, default: 50 },
    prerequisites: [{ type: Schema.Types.ObjectId, ref: 'Mission' }],
    sequence: { type: Number, required: true, default: 1 },
    gradeEligibility: [{ type: String, trim: true }],
    estimatedDurationMinutes: { type: Number, required: true, min: 1, default: 10 },
    learningObjectives: [{ type: String, trim: true }],
    contentReference: { type: String, trim: true },
    positionX: { type: Number, required: true, min: 0, max: 100 },
    positionY: { type: Number, required: true, min: 0, max: 100 },
    isPublished: { type: Boolean, required: true, default: true, index: true },
  },
  { timestamps: true },
);

missionSchema.index({ mapId: 1, slug: 1 }, { unique: true });
missionSchema.index({ mapId: 1, sequence: 1 });

export const MissionModel: Model<IMission> =
  (mongoose.models.Mission as Model<IMission>) ||
  mongoose.model<IMission>('Mission', missionSchema);
