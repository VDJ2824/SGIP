import mongoose from 'mongoose';

const TaskSchema = new mongoose.Schema(
  {
    taskId: { type: String, required: true },
    type: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    relatedSkill: { type: String, default: '' },
    priority: { type: String, enum: ['High', 'Medium', 'Low'], required: true },
    estimatedWeeks: { type: Number, default: 1, min: 0 },
    estimatedHours: { type: Number, default: 4, min: 0 },
    suggestedResources: { type: [String], default: [] },
    suggestedProjects: { type: [String], default: [] },
    completionCriteria: { type: [String], default: [] },
    dependsOn: { type: [String], default: [] },
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed', 'skipped'],
      default: 'not_started',
    },
    completedAt: { type: Date, default: null },
  },
  { _id: false },
);

const PhaseSchema = new mongoose.Schema(
  {
    phaseNumber: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    priority: { type: String, enum: ['High', 'Medium', 'Low', 'Always'], required: true },
    estimatedWeeks: { type: Number, default: 0, min: 0 },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    tasks: { type: [TaskSchema], default: [] },
  },
  { _id: false },
);

const RoadmapSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true, trim: true },
    gapReportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GapAnalysisReport',
      required: true,
      index: true,
    },
    careerRoleId: { type: mongoose.Schema.Types.ObjectId, ref: 'CareerRole', required: true },
    targetRoleSnapshot: {
      title: { type: String, default: '' },
      category: { type: String, default: '' },
      experienceLevel: { type: String, default: '' },
    },
    readinessScoreAtGeneration: { type: Number, default: 0, min: 0, max: 100 },
    estimatedCompletionWeeks: { type: Number, default: 0, min: 0 },
    overallProgress: { type: Number, default: 0, min: 0, max: 100 },
    status: { type: String, enum: ['active', 'completed', 'archived'], default: 'active', index: true },
    phases: { type: [PhaseSchema], default: [] },
    aiEnhancement: {
      used: { type: Boolean, default: false },
      provider: { type: String, default: '' },
      generatedAt: { type: Date, default: null },
      motivationalExplanation: { type: String, default: '' },
      sequencingAdvice: { type: [String], default: [] },
      studyTips: { type: [String], default: [] },
      extraResources: { type: [String], default: [] },
    },
  },
  { timestamps: true },
);

RoadmapSchema.index({ userId: 1, status: 1, createdAt: -1 });
RoadmapSchema.index({ userId: 1, gapReportId: 1 });

export const Roadmap = mongoose.model('Roadmap', RoadmapSchema);
