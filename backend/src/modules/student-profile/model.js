import mongoose from 'mongoose';

const ExperienceSchema = new mongoose.Schema(
  {
    company: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    duration: { type: String, required: true, trim: true },
    highlights: [{ type: String }],
  },
  { _id: false },
);

const CertificationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    issuer: { type: String, required: true, trim: true },
    year: { type: String, required: true, trim: true },
    status: { type: String, enum: ['verified', 'pending', 'rejected'], default: 'pending' },
  },
  { _id: false },
);

const ResumeSchema = new mongoose.Schema(
  {
    fileName: { type: String, default: '' },
    url: { type: String, default: '' },
    publicId: { type: String, default: '' },
    mimeType: { type: String, default: '' },
    size: { type: Number, default: 0 },
  },
  { _id: false },
);

const StudentProfileSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, unique: true, index: true, trim: true },
    userId: { type: String, required: true, unique: true, index: true, trim: true },
    mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    personal: {
      fullName: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true, lowercase: true },
      phone: { type: String, default: '' },
      location: { type: String, default: '' },
      github: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      bio: { type: String, default: '' },
      targetRole: { type: String, default: '' },
      targetRoleId: { type: String, default: '', index: true },
      targetRoleSource: { type: String, default: '' },
      targetRoleReviewStatus: { type: String, default: '' },
      targetRoleSelectedAt: { type: Date, default: null },
    },
    education: {
      institution: { type: String, default: '' },
      degree: { type: String, default: '' },
      semester: { type: String, default: '' },
      cgpa: { type: String, default: '' },
      graduationYear: { type: String, default: '' },
    },
    experience: { type: [ExperienceSchema], default: [] },
    certifications: { type: [CertificationSchema], default: [] },
    resume: { type: ResumeSchema, default: () => ({}) },
    topSkills: { type: [String], default: [] },
    strengths: { type: [String], default: [] },
    improvementAreas: { type: [String], default: [] },
    overallReadiness: { type: Number, default: 0, min: 0, max: 100 },
  },
  { timestamps: true },
);

StudentProfileSchema.index({
  'personal.fullName': 'text',
  'personal.email': 'text',
  'personal.targetRole': 'text',
});

export const StudentProfile = mongoose.model('StudentProfile', StudentProfileSchema);
