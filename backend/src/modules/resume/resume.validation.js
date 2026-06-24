import { z } from 'zod';

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid resume id');

export const resumeIdSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  query: z.object({ includeRawText: z.string().optional() }).passthrough().optional(),
  body: z.object({}).passthrough().optional(),
});

export const resumeListSchema = z.object({
  params: z.object({}).passthrough().optional(),
  body: z.object({}).passthrough().optional(),
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
  }).passthrough(),
});

const reviewedSkillSchema = z.object({
  name: z.string().trim().min(1).max(80),
  category: z.enum([
    'Programming',
    'Frontend',
    'Backend',
    'Database',
    'Cloud',
    'Data/AI',
    'Computer Vision',
    'Tools',
    'Soft Skill',
    'Domain Skill',
    'Other',
  ]),
  confidence: z.coerce.number().min(0).max(1),
  level: z.coerce.number().int().min(1).max(3),
  evidenceText: z.string().trim().max(500).optional().default(''),
});

export const reviewResumeSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  query: z.object({}).passthrough().optional(),
  body: z.object({
    skills: z.array(reviewedSkillSchema).min(1, 'At least one reviewed skill is required').max(50),
  }),
});
