import mongoose from 'mongoose';

const RequirementSchema = new mongoose.Schema(
  {
    requiredSkills: [{ type: String }],
    preferredSkills: [{ type: String }],
    responsibilities: [{ type: String }],
  },
  { _id: false },
);

const CareerRoleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, index: true },
    slug: { type: String, required: true, trim: true, unique: true, index: true },
    companyType: { type: String, required: true, index: true },
    level: { type: String, required: true, index: true },
    location: { type: String, default: '' },
    salaryBand: { type: String, default: '' },
    description: { type: String, default: '' },
    requirements: { type: RequirementSchema, default: () => ({}) },
    searchKeywords: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

CareerRoleSchema.index({
  title: 'text',
  slug: 'text',
  companyType: 'text',
  level: 'text',
  location: 'text',
  description: 'text',
  searchKeywords: 'text',
});

export const CareerRole = mongoose.model('CareerRole', CareerRoleSchema);
