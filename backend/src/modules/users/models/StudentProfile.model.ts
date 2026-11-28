import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IStudentProfile extends Document {
  studentId: string;
  displayName: string;
  classGrade: string;
  school: string;
  schoolLocation: string;
  preferredLanguage: string;
  timezone: string;
  interests: string[];
  learningPreferences: {
    pace: 'relaxed' | 'balanced' | 'fast';
    visualMode: 'illustrated' | 'compact';
    audioHints: boolean;
  };
  accessibilitySettings: {
    highContrast: boolean;
    reducedMotion: boolean;
    fontSize: 'small' | 'medium' | 'large';
  };
  lastVisitedSubjectSlug?: string;
  lastAttemptedMissionId?: string;
  leaderboardOptOut: boolean;
  showSchoolOnLeaderboard: boolean;
  bestGlobalRank?: number;
  activeTitle?: string;
  conqueredSubjects: string[];
  createdAt: Date;
  updatedAt: Date;
}

const studentProfileSchema = new Schema<IStudentProfile>(
  {
    studentId: { type: String, required: true, unique: true, index: true },
    displayName: { type: String, required: true, trim: true, maxlength: 80 },
    classGrade: { type: String, trim: true, default: 'Grade 8', maxlength: 30 },
    school: { type: String, trim: true, default: '', maxlength: 120 },
    schoolLocation: { type: String, trim: true, default: '', maxlength: 120 },
    preferredLanguage: { type: String, trim: true, default: 'English', maxlength: 40 },
    timezone: { type: String, trim: true, default: 'UTC', maxlength: 64 },
    interests: { type: [String], default: ['Science', 'Mathematics'] },
    learningPreferences: {
      pace: {
        type: String,
        enum: ['relaxed', 'balanced', 'fast'],
        default: 'balanced',
      },
      visualMode: {
        type: String,
        enum: ['illustrated', 'compact'],
        default: 'illustrated',
      },
      audioHints: { type: Boolean, default: true },
    },
    accessibilitySettings: {
      highContrast: { type: Boolean, default: false },
      reducedMotion: { type: Boolean, default: false },
      fontSize: {
        type: String,
        enum: ['small', 'medium', 'large'],
        default: 'medium',
      },
    },
    lastVisitedSubjectSlug: { type: String, trim: true },
    lastAttemptedMissionId: { type: String, trim: true },
    leaderboardOptOut: { type: Boolean, default: false, index: true },
    showSchoolOnLeaderboard: { type: Boolean, default: false },
    bestGlobalRank: { type: Number, min: 1 },
    activeTitle: { type: String, trim: true, maxlength: 60 },
    conqueredSubjects: { type: [String], default: [] },
  },
  { timestamps: true },
);

studentProfileSchema.index({ school: 1 });
studentProfileSchema.index({ classGrade: 1 });

export const StudentProfileModel: Model<IStudentProfile> =
  (mongoose.models.StudentProfile as Model<IStudentProfile>) ||
  mongoose.model<IStudentProfile>('StudentProfile', studentProfileSchema);
