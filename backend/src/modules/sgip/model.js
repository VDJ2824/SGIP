import mongoose from 'mongoose';

const SkillScoreSchema = new mongoose.Schema(
  {
    skill: { type: String, required: true, trim: true },
    score: { type: Number, default: 0, min: 0, max: 100 },
    source: { type: String, default: '' },
    level: { type: String, default: '' },
  },
  { _id: false },
);

const GapItemSchema = new mongoose.Schema(
  {
    skill: { type: String, required: true, trim: true },
    current: { type: Number, default: 0, min: 0, max: 100 },
    target: { type: Number, default: 100, min: 0, max: 100 },
    gap: { type: Number, default: 0 },
    priority: { type: String, default: 'Low' },
    reason: { type: String, default: '' },
  },
  { _id: false },
);

const ReadinessComponentSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    value: { type: Number, default: 0, min: 0, max: 100 },
    weight: { type: Number, default: 0, min: 0, max: 100 },
  },
  { _id: false },
);

const GapReportSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, index: true, trim: true },
    roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'CareerRole', default: null, index: true },
    roleTitle: { type: String, default: '', trim: true },
    readinessScore: { type: Number, default: 0, min: 0, max: 100 },
    confidenceScore: { type: Number, default: 0, min: 0, max: 100 },
    profileCompleteness: { type: Number, default: 0, min: 0, max: 100 },
    coreEligibility: { type: Number, default: 0, min: 0, max: 100 },
    evidenceStrength: { type: Number, default: 0, min: 0, max: 100 },
    compatibility: { type: Number, default: 0, min: 0, max: 100 },
    trustAndRecency: { type: Number, default: 0, min: 0, max: 100 },
    matchingSkills: { type: [SkillScoreSchema], default: [] },
    missingSkills: { type: [GapItemSchema], default: [] },
    recommendations: { type: [String], default: [] },
    readinessComponents: { type: [ReadinessComponentSchema], default: [] },
    assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', default: null },
    meta: { type: Object, default: () => ({}) },
  },
  { timestamps: true },
);

const AssessmentSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, index: true, trim: true },
    roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'CareerRole', default: null, index: true },
    roleTitle: { type: String, default: '', trim: true },
    readinessScore: { type: Number, default: 0, min: 0, max: 100 },
    confidenceScore: { type: Number, default: 0, min: 0, max: 100 },
    profileCompleteness: { type: Number, default: 0, min: 0, max: 100 },
    coreEligibility: { type: Number, default: 0, min: 0, max: 100 },
    evidenceStrength: { type: Number, default: 0, min: 0, max: 100 },
    compatibility: { type: Number, default: 0, min: 0, max: 100 },
    trustAndRecency: { type: Number, default: 0, min: 0, max: 100 },
    missingSkillsCount: { type: Number, default: 0 },
    matchingSkillsCount: { type: Number, default: 0 },
    status: { type: String, default: 'completed' },
    meta: { type: Object, default: () => ({}) },
  },
  { timestamps: true },
);

GapReportSchema.index({ studentId: 1, roleId: 1, createdAt: -1 });
AssessmentSchema.index({ studentId: 1, roleId: 1, createdAt: -1 });

export const GapReport = mongoose.model('GapReport', GapReportSchema);
export const Assessment = mongoose.model('Assessment', AssessmentSchema);
