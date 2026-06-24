import { z } from 'zod';

export const idParamSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({}).passthrough().optional(),
  query: z.object({}).passthrough().optional(),
});

export const listQuerySchema = z.object({
  params: z.object({}).passthrough().optional(),
  body: z.object({}).passthrough().optional(),
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    sortBy: z.string().optional(),
  }).passthrough(),
});
