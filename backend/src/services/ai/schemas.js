import { z } from 'zod';

export const extractedSkillSchema = z.object({
  name: z.string().min(1),
  confidence: z.number().min(0).max(100),
  category: z.string().default('General'),
  source: z.string().default('ai'),
});

export const resumeSkillExtractionSchema = z.object({
  skills: z.array(extractedSkillSchema),
  summary: z.string().default(''),
});

export const jobDescriptionParsingSchema = z.object({
  title: z.string().default(''),
  companyType: z.string().default(''),
  level: z.string().default(''),
  requiredSkills: z.array(z.string()),
  preferredSkills: z.array(z.string()),
  responsibilities: z.array(z.string()),
});

export const normalizedSkillSchema = z.object({
  original: z.string(),
  normalized: z.string(),
  category: z.string().default('General'),
  aliases: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(100),
});

export const roadmapTaskSchema = z.object({
  title: z.string(),
  description: z.string().default(''),
  dueDate: z.string().default(''),
  skills: z.array(z.string()).default([]),
  priority: z.string().default('Medium'),
});

export const roadmapGenerationSchema = z.object({
  title: z.string(),
  overview: z.string(),
  milestones: z.array(z.object({
    title: z.string(),
    dueDate: z.string().default(''),
    tasks: z.array(roadmapTaskSchema),
  })),
});

export const projectRecommendationSchema = z.object({
  projects: z.array(z.object({
    title: z.string(),
    summary: z.string(),
    skills: z.array(z.string()),
    difficulty: z.string().default('Intermediate'),
  })),
});
