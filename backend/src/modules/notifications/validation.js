import { z } from 'zod';

export const createNotificationSchema = z.object({
  params: z.object({}).passthrough().optional(),
  query: z.object({}).passthrough().optional(),
  body: z.object({
    studentId: z.string().min(1),
    title: z.string().min(1),
    body: z.string().min(1),
    category: z.string().min(1),
    priority: z.enum(['low', 'medium', 'high']).optional().default('medium'),
    read: z.boolean().optional().default(false),
  }),
});

export const notificationListSchema = z.object({
  params: z.object({}).passthrough().optional(),
  body: z.object({}).passthrough().optional(),
  query: z
    .object({
      page: z.string().optional(),
      limit: z.string().optional(),
      search: z.string().optional(),
      studentId: z.string().optional(),
      category: z.string().optional(),
      read: z.enum(['true', 'false']).optional(),
    })
    .passthrough(),
});

export const notificationIdSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  query: z.object({}).passthrough().optional(),
  body: z.object({}).passthrough().optional(),
});

export const markNotificationReadSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  query: z.object({}).passthrough().optional(),
  body: z.object({
    read: z.boolean().optional().default(true),
  }),
});
