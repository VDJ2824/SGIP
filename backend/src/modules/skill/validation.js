import { z } from 'zod';

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid skill id');

export const updateSkillLevelSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  query: z.object({}).passthrough().optional(),
  body: z.object({
    level: z.coerce.number().int().min(1).max(3),
  }),
});
