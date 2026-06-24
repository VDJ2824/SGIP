import mongoose from 'mongoose';

const ScoreSchema = new mongoose.Schema(
  {
    rawScore: { type: Number, default: 0, min: 0, max: 100 },
    weightedScore: { type: Number, default: 0, min: 0 },
    maxWeight: { type: Number, required: true },
    explanation: { type: String, default: '' },
  },
  { _id: false },
);

const RoleSkillSnapshotSchema = new mongoose.Schema(
  {
    name: String,
    normalizedName: String,
    category: String,
    importance: String,
    minimumLevel: String,
  },
  { _id: false },
);

const MatchSchema = new mongoose.Schema(
  {
    skillName: String,
    normalizedName: String,
    roleImportance: String,
    requiredLevel: String,
    studentLevel: String,
    evidenceCount: { type: Number, default: 0 },
    bestEvidenceStatus: String,
    evidenceStatuses: [String],
    matchedStudentSkills: [String],
    matchType: String,
    confidence: { type: Number, default: 0 },
    explanation: String,
  },
  { _id: false },
);

const PartialMatchSchema = new mongoose.Schema(
  {
    skillName: String,
    normalizedName: String,
    requiredLevel: String,
    studentLevel: String,
    evidenceCount: { type: Number, default: 0 },
    bestEvidenceStatus: String,
    evidenceStatuses: [String],
    gap: { type: Number, default: 0 },
    matchedStudentSkills: [String],
    matchType: String,
    confidence: { type: Number, default: 0 },
    explanation: String,
  },
  { _id: false },
);

const MissingSkillSchema = new mongoose.Schema(
  {
    skillName: String,
    normalizedName: String,
    category: String,
    importance: String,
    minimumLevel: String,
    reason: String,
  },
  { _id: false },
);

const WeakEvidenceSchema = new mongoose.Schema(
  {
    skillName: String,
    normalizedName: String,
    issue: String,
    recommendation: String,
  },
  { _id: false },
);

const GapAnalysisReportSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    careerRoleId: { type: mongoose.Schema.Types.ObjectId, ref: 'CareerRole', required: true, index: true },
    targetRoleSnapshot: {
      title: String,
      category: String,
      experienceLevel: String,
      source: String,
      reviewStatus: String,
      requiredSkills: { type: [RoleSkillSnapshotSchema], default: [] },
      preferredSkills: { type: [RoleSkillSnapshotSchema], default: [] },
    },
    readinessScore: { type: Number, default: 0, min: 0, max: 100 },
    componentScores: {
      profileCompleteness: { type: ScoreSchema, required: true },
      coreEligibility: { type: ScoreSchema, required: true },
      evidenceStrength: { type: ScoreSchema, required: true },
      compatibility: { type: ScoreSchema, required: true },
      trustAndRecency: { type: ScoreSchema, required: true },
    },
    verifiedMatches: { type: [MatchSchema], default: [] },
    studentConfirmedMatches: { type: [MatchSchema], default: [] },
    pendingEvidenceMatches: { type: [MatchSchema], default: [] },
    unverifiedMatches: { type: [MatchSchema], default: [] },
    partialMatches: { type: [PartialMatchSchema], default: [] },
    missingRequiredSkills: { type: [MissingSkillSchema], default: [] },
    missingPreferredSkills: { type: [MissingSkillSchema], default: [] },
    weakEvidenceSkills: { type: [WeakEvidenceSchema], default: [] },
    recommendations: { type: [String], default: [] },
    roadmapInput: {
      prioritySkills: { type: [String], default: [] },
      strengthenSkills: { type: [String], default: [] },
      verifySkills: { type: [String], default: [] },
    },
    aiEnhancedExplanation: {
      used: { type: Boolean, default: false },
      provider: { type: String, default: '' },
      model: { type: String, default: '' },
      generatedAt: { type: Date, default: null },
      text: { type: String, default: '' },
    },
    status: { type: String, enum: ['generated', 'archived'], default: 'generated', index: true },
  },
  { timestamps: true },
);

GapAnalysisReportSchema.index({ userId: 1, status: 1, createdAt: -1 });

export const GapAnalysisReport = mongoose.model(
  'GapAnalysisReport',
  GapAnalysisReportSchema,
  'gap_analysis_reports',
);
