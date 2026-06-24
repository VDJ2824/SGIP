import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const runGapAnalysisSchema = z.object({
  params: z.object({}).passthrough().optional(),
  query: z.object({}).passthrough().optional(),
  body: z.object({ careerRoleId: objectId }),
});

export const gapAnalysisIdSchema = z.object({
  params: z.object({ id: objectId }),
  query: z.object({}).passthrough().optional(),
  body: z.object({}).passthrough().optional(),
});

export const gapAnalysisHistorySchema = z.object({
  params: z.object({}).passthrough().optional(),
  body: z.object({}).passthrough().optional(),
  query: z.object({ page: z.string().optional(), limit: z.string().optional() }).passthrough(),
});
