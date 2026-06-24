import { z } from 'zod';

const baseQuery = z.object({
  studentId: z.string().min(1).optional(),
  roleId: z.string().min(1).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
}).passthrough();

export const sgipDashboardQuerySchema = z.object({
  params: z.object({}).passthrough().optional(),
  body: z.object({}).passthrough().optional(),
  query: baseQuery,
});

export const sgipReportsQuerySchema = z.object({
  params: z.object({}).passthrough().optional(),
  body: z.object({}).passthrough().optional(),
  query: baseQuery,
});

export const sgipAnalyticsQuerySchema = z.object({
  params: z.object({}).passthrough().optional(),
  body: z.object({}).passthrough().optional(),
  query: baseQuery,
});

export const sgipAnalysisInputSchema = z.object({
  studentId: z.string().min(1),
  roleId: z.string().min(1).optional(),
});
