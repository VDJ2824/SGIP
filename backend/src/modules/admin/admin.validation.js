import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const empty = z.object({}).passthrough().optional();
const pagination = {
  page: z.string().optional(),
  limit: z.string().optional(),
};
const requiredSkill = z.object({
  name: z.string().trim().min(1),
  category: z.string().trim().optional(),
  importance: z.enum(['High', 'Medium', 'Low']).optional(),
  minimumLevel: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional(),
});
const preferredSkill = z.object({
  name: z.string().trim().min(1),
  category: z.string().trim().optional(),
});
const roleBody = z.object({
  title: z.string().trim().min(2),
  aliases: z.array(z.string().trim().min(1)).optional(),
  category: z.string().trim().min(1).optional(),
  description: z.string().trim().optional(),
  experienceLevel: z.string().trim().optional(),
  requiredSkills: z.array(requiredSkill).min(1),
  preferredSkills: z.array(preferredSkill).optional(),
  roadmapHints: z.array(z.string().trim().min(1)).optional(),
  reviewStatus: z.enum(['approved', 'pending']).optional(),
  isActive: z.boolean().optional(),
});

export const noInputSchema = z.object({ params: empty, query: empty, body: empty });
export const createMentorSchema = z.object({
  params: empty,
  query: empty,
  body: z.object({
    name: z.string().trim().min(2),
    email: z.string().trim().email(),
    temporaryPassword: z.string().min(8),
    department: z.string().trim().min(2),
  }),
});
export const mentorListSchema = z.object({ params: empty, body: empty, query: z.object(pagination).passthrough() });
export const idSchema = z.object({ params: z.object({ id: objectId }), query: empty, body: empty });
export const mentorUpdateSchema = z.object({
  params: z.object({ id: objectId }),
  query: empty,
  body: z.object({ name: z.string().trim().min(2).optional(), department: z.string().trim().min(2).optional() }).refine((value) => Object.keys(value).length > 0),
});
export const statusSchema = z.object({ params: z.object({ id: objectId }), query: empty, body: z.object({ isActive: z.boolean() }) });
export const studentListSchema = z.object({
  params: empty,
  body: empty,
  query: z.object({ ...pagination, search: z.string().optional(), department: z.string().optional(), mentorId: objectId.optional() }).passthrough(),
});
export const assignMentorSchema = z.object({ params: z.object({ id: objectId }), query: empty, body: z.object({ mentorId: objectId }) });
export const careerRoleListSchema = z.object({
  params: empty,
  body: empty,
  query: z.object({ ...pagination, search: z.string().optional(), source: z.enum(['seeded', 'ai_generated', 'manual']).optional(), reviewStatus: z.enum(['approved', 'pending', 'rejected', 'archived']).optional(), category: z.string().optional() }).passthrough(),
});
export const createCareerRoleSchema = z.object({ params: empty, query: empty, body: roleBody });
export const updateCareerRoleSchema = z.object({ params: z.object({ id: objectId }), query: empty, body: roleBody.partial().refine((value) => Object.keys(value).length > 0) });
export const reviewCareerRoleSchema = z.object({
  params: z.object({ id: objectId }),
  query: empty,
  body: z.object({ decision: z.enum(['approved', 'rejected']), comment: z.string().trim().max(1000).optional().default('') }),
});
export const activityListSchema = z.object({
  params: empty,
  body: empty,
  query: z.object({ ...pagination, action: z.string().optional(), actorRole: z.enum(['student', 'mentor', 'admin', 'system']).optional(), dateFrom: z.string().datetime().optional(), dateTo: z.string().datetime().optional() }).passthrough(),
});
