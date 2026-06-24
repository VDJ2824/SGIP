import { z } from 'zod';

const experienceSchema = z.object({
  company: z.string().min(1),
  role: z.string().min(1),
  duration: z.string().min(1),
  highlights: z.array(z.string()).default([]),
});

const certificationSchema = z.object({
  name: z.string().min(1),
  issuer: z.string().min(1),
  year: z.string().min(1),
  status: z.enum(['verified', 'pending', 'rejected']).default('pending'),
});

const resumeSchema = z.object({
  fileName: z.string().optional().default(''),
  url: z.string().url().optional().or(z.literal('')).default(''),
  publicId: z.string().optional().default(''),
  mimeType: z.string().optional().default(''),
  size: z.coerce.number().nonnegative().optional().default(0),
});

const personalSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional().default(''),
  location: z.string().optional().default(''),
  github: z.string().optional().default(''),
  linkedin: z.string().optional().default(''),
  bio: z.string().optional().default(''),
  targetRole: z.string().optional().default(''),
  targetRoleId: z.string().optional().default(''),
  targetRoleSource: z.string().optional().default(''),
  targetRoleReviewStatus: z.string().optional().default(''),
  targetRoleSelectedAt: z.coerce.date().nullable().optional(),
});

const educationSchema = z.object({
  institution: z.string().optional().default(''),
  degree: z.string().optional().default(''),
  semester: z.string().optional().default(''),
  cgpa: z.string().optional().default(''),
  graduationYear: z.string().optional().default(''),
});

export const createStudentProfileSchema = z.object({
  params: z.object({}).passthrough().optional(),
  query: z.object({}).passthrough().optional(),
  body: z.object({
    studentId: z.string().min(1).optional(),
    personal: personalSchema,
    education: educationSchema.optional().default({}),
    experience: z.array(experienceSchema).default([]),
    certifications: z.array(certificationSchema).default([]),
    resume: resumeSchema.optional().default({}),
    topSkills: z.array(z.string()).default([]),
    strengths: z.array(z.string()).default([]),
    improvementAreas: z.array(z.string()).default([]),
    overallReadiness: z.coerce.number().min(0).max(100).optional().default(0),
  }),
});

export const updateStudentProfileSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  query: z.object({}).passthrough().optional(),
  body: z.object({
    studentId: z.string().min(1).optional(),
    personal: personalSchema.partial().optional(),
    education: educationSchema.partial().optional(),
    experience: z.array(experienceSchema).optional(),
    certifications: z.array(certificationSchema).optional(),
    resume: resumeSchema.partial().optional(),
    topSkills: z.array(z.string()).optional(),
    strengths: z.array(z.string()).optional(),
    improvementAreas: z.array(z.string()).optional(),
    overallReadiness: z.coerce.number().min(0).max(100).optional(),
  }),
});

export const updateStudentProfileMeSchema = z.object({
  params: z.object({}).passthrough().optional(),
  query: z.object({
    studentId: z.string().min(1).optional(),
  }).passthrough(),
  body: z.object({
    studentId: z.string().min(1).optional(),
    personal: personalSchema.partial().optional(),
    education: educationSchema.partial().optional(),
    experience: z.array(experienceSchema).optional(),
    certifications: z.array(certificationSchema).optional(),
    resume: resumeSchema.partial().optional(),
    topSkills: z.array(z.string()).optional(),
    strengths: z.array(z.string()).optional(),
    improvementAreas: z.array(z.string()).optional(),
    overallReadiness: z.coerce.number().min(0).max(100).optional(),
  }),
});

export const studentProfileListSchema = z.object({
  params: z.object({}).passthrough().optional(),
  body: z.object({}).passthrough().optional(),
  query: z
    .object({
      page: z.string().optional(),
      limit: z.string().optional(),
      search: z.string().optional(),
      studentId: z.string().optional(),
      targetRole: z.string().optional(),
    })
    .passthrough(),
});

export const studentProfileIdSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  query: z.object({}).passthrough().optional(),
  body: z.object({}).passthrough().optional(),
});

export const studentProfileMeSchema = z.object({
  params: z.object({}).passthrough().optional(),
  query: z.object({
    studentId: z.string().min(1).optional(),
  }).passthrough(),
  body: z.object({}).passthrough().optional(),
});
