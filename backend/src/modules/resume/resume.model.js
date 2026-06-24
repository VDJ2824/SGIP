import mongoose from 'mongoose';

const ExtractedSkillSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    normalizedName: { type: String, required: true, trim: true, index: true },
    category: { type: String, required: true, trim: true },
    confidence: { type: Number, min: 0, max: 1, default: 0 },
    level: { type: Number, enum: [1, 2, 3], default: 2 },
    evidenceText: { type: String, default: '' },
    source: { type: String, default: 'resume' },
  },
  { _id: false },
);

const AiMetadataSchema = new mongoose.Schema(
  {
    provider: { type: String, default: 'fallback' },
    model: { type: String, default: 'deterministic-dictionary' },
    promptVersion: { type: String, default: 'resume-skill-extraction-v1' },
    processedAt: { type: Date, default: null },
    confidence: { type: Number, min: 0, max: 1, default: 0 },
    fallbackUsed: { type: Boolean, default: true },
    redactedBeforeAI: { type: Boolean, default: true },
    attemptedProviders: { type: [String], default: [] },
    failureReason: { type: String, default: '' },
  },
  { _id: false },
);

const ResumeSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true, trim: true },
    originalFileName: { type: String, required: true, trim: true },
    fileUrl: { type: String, required: true },
    filePublicId: { type: String, default: '' },
    fileMimeType: { type: String, required: true },
    fileSize: { type: Number, required: true, min: 1 },
    rawText: { type: String, default: '' },
    redactedText: { type: String, default: '' },
    redactionSummary: {
      emailsRemoved: { type: Number, default: 0 },
      phonesRemoved: { type: Number, default: 0 },
      linksRemoved: { type: Number, default: 0 },
      headerLinesRemoved: { type: Number, default: 0 },
      nameRedacted: { type: Boolean, default: false },
    },
    extractedSkills: { type: [ExtractedSkillSchema], default: [] },
    extractedEducation: { type: [String], default: [] },
    extractedExperience: { type: [String], default: [] },
    extractedCertifications: { type: [String], default: [] },
    aiMetadata: { type: AiMetadataSchema, default: () => ({}) },
    status: {
      type: String,
      enum: ['uploaded', 'parsed', 'redacted', 'extraction_failed', 'reviewed'],
      default: 'uploaded',
      index: true,
    },
  },
  { timestamps: true },
);

ResumeSchema.index({ originalFileName: 'text', redactedText: 'text' });

export const Resume = mongoose.model('Resume', ResumeSchema);
