import mongoose from 'mongoose';

const RequiredSkillSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    canonicalName: { type: String, default: '', trim: true },
    normalizedName: { type: String, default: '', trim: true },
    category: { type: String, default: 'General', trim: true },
    importance: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
    minimumLevel: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Intermediate' },
  },
  { _id: false },
);

const PreferredSkillSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    canonicalName: { type: String, default: '', trim: true },
    normalizedName: { type: String, default: '', trim: true },
    category: { type: String, default: 'General', trim: true },
  },
  { _id: false },
);

const AiMetadataSchema = new mongoose.Schema(
  {
    provider: { type: String, default: '' },
    model: { type: String, default: '' },
    promptVersion: { type: String, default: '' },
    generatedAt: { type: Date, default: null },
    confidence: { type: Number, default: 0, min: 0, max: 1 },
  },
  { _id: false },
);

const CareerRoleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, index: true },
    normalizedTitle: { type: String, required: true, trim: true },
    // Retain legacy indexed fields while existing catalog documents are migrated.
    slug: { type: String, required: true, trim: true },
    aliases: { type: [String], default: [] },
    category: { type: String, default: 'Software', trim: true, index: true },
    companyType: { type: String, default: 'Software', trim: true },
    description: { type: String, default: '' },
    experienceLevel: { type: String, default: 'Entry Level', trim: true, index: true },
    level: { type: String, default: 'Entry Level', trim: true },
    requiredSkills: { type: [RequiredSkillSchema], default: [] },
    preferredSkills: { type: [PreferredSkillSchema], default: [] },
    roadmapHints: { type: [String], default: [] },
    source: { type: String, enum: ['seeded', 'ai_generated', 'manual'], default: 'manual', index: true },
    reviewStatus: { type: String, enum: ['approved', 'pending', 'rejected', 'archived'], default: 'approved', index: true },
    isActive: { type: Boolean, default: true, index: true },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
    reviewComment: { type: String, default: '', trim: true },
    aiMetadata: { type: AiMetadataSchema, default: () => ({}) },
  },
  { timestamps: true, autoIndex: false },
);

export const CareerRole = mongoose.model('CareerRole', CareerRoleSchema);
