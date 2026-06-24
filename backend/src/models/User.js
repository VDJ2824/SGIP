import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['student', 'mentor', 'admin'], default: 'student', index: true },
    department: { type: String, default: '', trim: true },
    mustChangePassword: { type: Boolean, default: false },
    createdByAdmin: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true, index: true },
    isEmailVerified: { type: Boolean, default: false },
    otp: { type: String, default: '' },
    otpExpiresAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const User = mongoose.model('User', UserSchema);
