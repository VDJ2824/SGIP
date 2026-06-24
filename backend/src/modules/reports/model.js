import mongoose from 'mongoose';

const ReportSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, index: true },
    type: { type: String, required: true, index: true },
    title: { type: String, required: true },
    sourceId: { type: String, default: '', index: true },
    snapshot: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
  },
  { timestamps: true },
);

ReportSchema.index({ studentId: 1, type: 1, createdAt: -1 });

export const Report = mongoose.model('Report', ReportSchema);
