import mongoose from 'mongoose';

const SkillSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    originalName: { type: String, default: '', trim: true },
    canonicalName: { type: String, default: '', trim: true },
    normalizedName: { type: String, required: true, trim: true, index: true },
    category: { type: String, required: true, trim: true, index: true },
    parentConcepts: { type: [String], default: [] },
    relatedTo: { type: [String], default: [] },
    // Mixed preserves existing string levels while all new writes are validated as numeric 1-3.
    level: {
      type: mongoose.Schema.Types.Mixed,
      default: 2,
      validate: {
        validator: (value) =>
          [1, 2, 3, '1', '2', '3', 'Beginner', 'Intermediate', 'Advanced', undefined, null, ''].includes(value),
        message: 'Skill level must be 1, 2, or 3',
      },
    },
    source: { type: String, default: 'manual', trim: true },
    sourceDetails: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    reviewState: {
      type: String,
      enum: ['student_confirmed', 'pending_review', 'mentor_approved', 'rejected', 'changes_requested', 'system_verified'],
      default: 'student_confirmed',
      index: true,
    },
    trustLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'medium', index: true },
    mentorApprovalRequired: { type: Boolean, default: false },
    evidenceSummary: {
      totalEvidence: { type: Number, default: 0 },
      approvedEvidence: { type: Number, default: 0 },
      studentConfirmedEvidence: { type: Number, default: 0 },
      pendingEvidence: { type: Number, default: 0 },
      rejectedEvidence: { type: Number, default: 0 },
      bestEvidenceStatus: { type: String, default: 'student_confirmed' },
      bestEvidenceType: { type: String, default: '' },
      bestEvidenceConfidence: { type: Number, default: 0 },
    },
    createdFrom: { type: String, default: 'manual', trim: true },
  },
  { timestamps: true },
);

SkillSchema.index({ userId: 1, normalizedName: 1 }, { unique: true });

export const Skill = mongoose.model('Skill', SkillSchema);
