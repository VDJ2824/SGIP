import { z } from 'zod';

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const urlField = z.string().url().optional().or(z.literal('')).default('');
const arrayFromMixedInput = z.preprocess((value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed : trimmed.split(/[,/|;]/g);
    } catch {
      return trimmed.split(/[,/|;]/g);
    }
  }
  return [];
}, z.array(z.string().min(1)));

const uploadedFileSchema = z
  .object({
    originalname: z.string().optional(),
    mimetype: z.string().optional(),
    size: z.number().optional(),
  })
  .optional();

export const evidenceTypes = ['resume', 'certificate', 'project', 'internship', 'assessment', 'coding_platform', 'research', 'competition', 'manual'];
export const verificationStatuses = ['draft', 'self_declared', 'pending', 'approved', 'rejected', 'changes_requested'];
export const mentorDecisions = ['approved', 'rejected', 'changes_requested'];
export const skillLevelSchema = z.preprocess(
  (value) => {
    const labels = { Beginner: 1, Intermediate: 2, Advanced: 3 };
    return labels[value] || value;
  },
  z.coerce.number().int().min(1).max(3),
);

const createEvidenceBodySchema = z
  .object({
    skillName: z.string().min(1).optional(),
    relatedSkills: arrayFromMixedInput.optional().default([]),
    category: z.string().min(1).default('Other'),
    level: skillLevelSchema,
    evidenceType: z.enum(evidenceTypes),
    title: z.string().min(1),
    description: z.string().optional().default(''),
    externalLink: urlField,
    issuingOrganization: z.string().optional().default(''),
    issueDate: z.coerce.date().optional(),
    expiryDate: z.coerce.date().optional(),
    projectName: z.string().optional().default(''),
    projectRole: z.string().optional().default(''),
    projectUrl: urlField,
    internshipCompany: z.string().optional().default(''),
    internshipRole: z.string().optional().default(''),
    internshipDuration: z.string().optional().default(''),
    assessmentName: z.string().optional().default(''),
    assessmentScore: z.coerce.number().optional(),
    confidence: z.coerce.number().min(0).max(1).optional(),
    verificationStatus: z.enum(verificationStatuses).optional(),
    source: z.string().optional().default('manual'),
  })
  .superRefine((body, ctx) => {
    if (!body.skillName && !body.relatedSkills.length) {
      ctx.addIssue({ code: 'custom', message: 'skillName or relatedSkills is required', path: ['skillName'] });
    }

    if (body.evidenceType === 'certificate') {
      if (!body.title && !body.issuingOrganization) {
        ctx.addIssue({ code: 'custom', message: 'Certificate title or issuing organization is required', path: ['title'] });
      }
      if (!body.externalLink) {
        ctx.addIssue({ code: 'custom', message: 'Certificate evidence requires an uploaded file or external link', path: ['externalLink'] });
      }
    }

    if (body.evidenceType === 'internship') {
      if (!body.internshipCompany) {
        ctx.addIssue({ code: 'custom', message: 'Internship company is required', path: ['internshipCompany'] });
      }
      if (!body.internshipRole) {
        ctx.addIssue({ code: 'custom', message: 'Internship role is required', path: ['internshipRole'] });
      }
    }

    if (body.evidenceType === 'project') {
      if (!body.projectName) {
        ctx.addIssue({ code: 'custom', message: 'Project name is required', path: ['projectName'] });
      }
      if (!body.description && !body.projectUrl) {
        ctx.addIssue({ code: 'custom', message: 'Project description or project URL is required', path: ['description'] });
      }
    }

    if (body.evidenceType === 'assessment') {
      if (!body.assessmentName) {
        ctx.addIssue({ code: 'custom', message: 'Assessment name is required', path: ['assessmentName'] });
      }
      if (body.assessmentScore === undefined || Number.isNaN(body.assessmentScore)) {
        ctx.addIssue({ code: 'custom', message: 'Assessment score is required', path: ['assessmentScore'] });
      }
    }
  });

const updateEvidenceBodySchema = z.object({
  skillName: z.string().min(1).optional(),
  relatedSkills: arrayFromMixedInput.optional(),
  category: z.string().min(1).optional(),
  level: skillLevelSchema.optional(),
  evidenceType: z.enum(evidenceTypes).optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  externalLink: urlField.optional(),
  issuingOrganization: z.string().optional(),
  issueDate: z.coerce.date().optional(),
  expiryDate: z.coerce.date().optional(),
  projectName: z.string().optional(),
  projectRole: z.string().optional(),
  projectUrl: urlField.optional(),
  internshipCompany: z.string().optional(),
  internshipRole: z.string().optional(),
  internshipDuration: z.string().optional(),
  assessmentName: z.string().optional(),
  assessmentScore: z.coerce.number().optional(),
  confidence: z.coerce.number().min(0).max(1).optional(),
  verificationStatus: z.enum(verificationStatuses).optional(),
  source: z.string().optional(),
});

export const createSkillEvidenceSchema = z
  .object({
    params: z.object({}).passthrough().optional(),
    query: z.object({}).passthrough().optional(),
    body: createEvidenceBodySchema,
    file: uploadedFileSchema,
  })
  .superRefine((payload, ctx) => {
    const hasFile = Boolean(payload.file?.size);
    const hasLink = Boolean(payload.body.externalLink);

    if (payload.body.evidenceType === 'certificate' && !hasFile && !hasLink) {
      ctx.addIssue({
        code: 'custom',
        message: 'Certificate evidence requires an uploaded file or external link',
        path: ['body', 'externalLink'],
      });
    }
  });

export const updateSkillEvidenceSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  query: z.object({}).passthrough().optional(),
  body: updateEvidenceBodySchema,
});

export const reviewSkillEvidenceSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    decision: z.enum(mentorDecisions),
    comment: z.string().optional().default(''),
  }),
  query: z.object({}).passthrough().optional(),
});

export const skillEvidenceListSchema = z.object({
  params: z.object({}).passthrough().optional(),
  body: z.object({}).passthrough().optional(),
  query: z
    .object({
      page: z.string().optional(),
      limit: z.string().optional(),
      search: z.string().optional(),
      status: z.string().optional(),
      category: z.string().optional(),
      evidenceType: z.string().optional(),
    })
    .passthrough(),
});

export const skillEvidenceIdSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  query: z.object({}).passthrough().optional(),
  body: z.object({}).passthrough().optional(),
});
