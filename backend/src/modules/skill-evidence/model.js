import mongoose from 'mongoose';

const MentorReviewSchema = new mongoose.Schema(
  {
    reviewedBy: { type: String, default: '', trim: true },
    reviewedAt: { type: Date, default: null },
    decision: {
      type: String,
      enum: ['approved', 'mentor_approved', 'rejected', 'changes_requested'],
      default: null,
    },
    comment: { type: String, default: '', trim: true },
  },
  { _id: false },
);

const SkillEvidenceSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true, trim: true },
    skillId: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true, index: true },
    skillLabel: { type: String, required: true, trim: true, index: true },

    evidenceType: {
      type: String,
      enum: ['resume', 'certificate', 'project', 'internship', 'assessment', 'coding_platform', 'research', 'competition', 'manual'],
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },

    fileUrl: { type: String, default: '' },
    filePublicId: { type: String, default: '' },
    externalLink: { type: String, default: '' },

    issuingOrganization: { type: String, default: '', trim: true },
    issueDate: { type: Date, default: null },
    expiryDate: { type: Date, default: null },

    projectName: { type: String, default: '', trim: true },
    projectRole: { type: String, default: '', trim: true },
    projectUrl: { type: String, default: '' },

    internshipCompany: { type: String, default: '', trim: true },
    internshipRole: { type: String, default: '', trim: true },
    internshipDuration: { type: String, default: '', trim: true },

    assessmentName: { type: String, default: '', trim: true },
    assessmentScore: { type: Number, default: null },

    confidence: { type: Number, default: 0.5, min: 0, max: 1 },
    verificationStatus: {
      type: String,
      enum: ['draft', 'self_declared', 'pending', 'approved', 'rejected', 'changes_requested'],
      default: 'pending',
      index: true,
    },
    reviewState: {
      type: String,
      enum: ['student_confirmed', 'pending_review', 'mentor_approved', 'rejected', 'changes_requested', 'system_verified'],
      default: 'pending_review',
      index: true,
    },
    trustLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'low', index: true },
    submittedAt: { type: Date, default: Date.now },

    source: { type: String, default: 'manual', trim: true },
    mentorApprovalRequired: { type: Boolean, default: true },
    mentorReview: { type: MentorReviewSchema, default: () => ({}) },
  },
  { timestamps: true },
);

SkillEvidenceSchema.index({ userId: 1, skillId: 1, verificationStatus: 1 });
SkillEvidenceSchema.index({ skillLabel: 'text', title: 'text', description: 'text' });

export const SkillEvidence = mongoose.model('SkillEvidence', SkillEvidenceSchema);
