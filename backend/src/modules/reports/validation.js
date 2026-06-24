import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid report id');
const type = z.enum(['profile-summary', 'resume-analysis', 'gap-analysis', 'roadmap', 'skill-evidence', 'progress']);
const query = z.object({ studentId: objectId.optional() }).passthrough();
const empty = z.object({}).passthrough().optional();

export const reportsQuerySchema = z.object({ params: empty, body: empty, query });
export const reportTypeSchema = z.object({ params: z.object({ type }), body: empty, query });
export const reportIdSchema = z.object({ params: z.object({ id: objectId }), body: empty, query });
export const compareSchema = z.object({
  params: empty, body: empty,
  query: query.extend({ previousReportId: objectId, currentReportId: objectId }),
});
