import { z } from 'zod';

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const generateRoadmapSchema = z.object({
  params: z.object({}).passthrough().optional(),
  query: z.object({}).passthrough().optional(),
  body: z.object({ gapReportId: objectIdSchema }),
});

export const roadmapIdSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  query: z.object({}).passthrough().optional(),
  body: z.object({}).passthrough().optional(),
});

export const roadmapHistorySchema = z.object({
  params: z.object({}).passthrough().optional(),
  body: z.object({}).passthrough().optional(),
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
  }).passthrough(),
});

export const updateRoadmapTaskSchema = z.object({
  params: z.object({ taskId: z.string().min(1) }),
  query: z.object({}).passthrough().optional(),
  body: z.object({
    status: z.enum(['not_started', 'in_progress', 'completed', 'skipped']),
  }),
});
