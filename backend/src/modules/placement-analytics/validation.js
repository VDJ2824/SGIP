import { z } from 'zod';

export const placementAnalyticsQuerySchema = z.object({
  params: z.object({}).passthrough().optional(),
  body: z.object({}).passthrough().optional(),
  query: z.object({
    studentId: z.string().optional(),
    roleId: z.string().optional(),
  }).passthrough(),
});
