import { z } from 'zod';

const requirementSchema = z.object({
  requiredSkills: z.array(z.string()).default([]),
  preferredSkills: z.array(z.string()).default([]),
  responsibilities: z.array(z.string()).default([]),
});

const baseRoleSchema = {
  title: z.string().min(1),
  slug: z.string().min(1),
  companyType: z.string().min(1),
  level: z.string().min(1),
  location: z.string().optional().default(''),
  salaryBand: z.string().optional().default(''),
  description: z.string().optional().default(''),
  requirements: requirementSchema.optional().default({}),
  searchKeywords: z.array(z.string()).default([]),
  isActive: z.boolean().optional().default(true),
};

export const createCareerRoleSchema = z.object({
  params: z.object({}).passthrough().optional(),
  query: z.object({}).passthrough().optional(),
  body: z.object(baseRoleSchema),
});

export const updateCareerRoleSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  query: z.object({}).passthrough().optional(),
  body: z.object({
    title: z.string().min(1).optional(),
    slug: z.string().min(1).optional(),
    companyType: z.string().min(1).optional(),
    level: z.string().min(1).optional(),
    location: z.string().optional(),
    salaryBand: z.string().optional(),
    description: z.string().optional(),
    requirements: requirementSchema.partial().optional(),
    searchKeywords: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const careerRoleListSchema = z.object({
  params: z.object({}).passthrough().optional(),
  body: z.object({}).passthrough().optional(),
  query: z
    .object({
      page: z.string().optional(),
      limit: z.string().optional(),
      search: z.string().optional(),
      companyType: z.string().optional(),
      level: z.string().optional(),
      location: z.string().optional(),
      isActive: z.enum(['true', 'false']).optional(),
      sortBy: z.string().optional(),
    })
    .passthrough(),
});

export const careerRoleIdSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  query: z.object({}).passthrough().optional(),
  body: z.object({}).passthrough().optional(),
});
