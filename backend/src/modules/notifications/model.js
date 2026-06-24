import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, index: true, trim: true },
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    category: { type: String, required: true, index: true, trim: true },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    read: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null },
  },
  { timestamps: true },
);

NotificationSchema.index({
  title: 'text',
  body: 'text',
  category: 'text',
});

export const Notification = mongoose.model('Notification', NotificationSchema);
