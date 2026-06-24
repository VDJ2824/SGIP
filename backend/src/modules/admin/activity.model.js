import mongoose from 'mongoose';

const ActivityLogSchema = new mongoose.Schema(
  {
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    actorRole: { type: String, enum: ['student', 'mentor', 'admin', 'system'], default: 'system', index: true },
    action: { type: String, required: true, trim: true, index: true },
    targetType: { type: String, required: true, trim: true, index: true },
    targetId: { type: String, default: '', trim: true, index: true },
    message: { type: String, required: true, trim: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
  },
  { timestamps: true },
);

ActivityLogSchema.index({ createdAt: -1, action: 1, actorRole: 1 });

export const ActivityLog = mongoose.model('ActivityLog', ActivityLogSchema);
