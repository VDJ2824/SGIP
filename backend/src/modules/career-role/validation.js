import { z } from 'zod';

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid role id');

const requiredSkillSchema = z.object({
  name: z.string().min(1),
  category: z.string().optional().default('General'),
  importance: z.enum(['High', 'Medium', 'Low']).optional().default('Medium'),
  minimumLevel: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional().default('Intermediate'),
});

const preferredSkillSchema = z.object({
  name: z.string().min(1),
  category: z.string().optional().default('General'),
});

const aiMetadataSchema = z.object({
  provider: z.string().optional().default(''),
  model: z.string().optional().default(''),
  promptVersion: z.string().optional().default(''),
  generatedAt: z.coerce.date().nullable().optional(),
  confidence: z.coerce.number().min(0).max(1).optional().default(0),
});

const baseRoleBodySchema = z.object({
  title: z.string().min(1),
  aliases: z.array(z.string()).optional().default([]),
  category: z.string().optional().default('Software'),
  description: z.string().optional().default(''),
  experienceLevel: z.string().optional().default('Entry Level'),
  requiredSkills: z.array(requiredSkillSchema).min(1),
  preferredSkills: z.array(preferredSkillSchema).optional().default([]),
  roadmapHints: z.array(z.string()).optional().default([]),
  source: z.enum(['seeded', 'ai_generated', 'manual']).optional().default('manual'),
  reviewStatus: z.enum(['approved', 'pending']).optional().default('approved'),
  aiMetadata: aiMetadataSchema.optional().default({}),
});

export const createCareerRoleSchema = z.object({
  params: z.object({}).passthrough().optional(),
  query: z.object({}).passthrough().optional(),
  body: baseRoleBodySchema,
});

export const updateCareerRoleSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  query: z.object({}).passthrough().optional(),
  body: baseRoleBodySchema.partial(),
});

export const careerRoleIdSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  query: z.object({}).passthrough().optional(),
  body: z.object({}).passthrough().optional(),
});

export const careerRoleListSchema = z.object({
  params: z.object({}).passthrough().optional(),
  body: z.object({}).passthrough().optional(),
  query: z
    .object({
      page: z.string().optional(),
      limit: z.string().optional(),
      search: z.string().optional(),
      category: z.string().optional(),
      experienceLevel: z.string().optional(),
      source: z.string().optional(),
      reviewStatus: z.string().optional(),
      sortBy: z.string().optional(),
    })
    .passthrough(),
});

export const careerRoleSearchSchema = z.object({
  params: z.object({}).passthrough().optional(),
  query: z.object({}).passthrough().optional(),
  body: z.object({
    query: z.string().min(2),
  }),
});

