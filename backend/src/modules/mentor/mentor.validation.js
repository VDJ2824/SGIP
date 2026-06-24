import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const empty = z.object({}).passthrough().optional();
const pagination = { page: z.string().optional(), limit: z.string().optional() };

export const noInputSchema = z.object({ params: empty, query: empty, body: empty });
export const listSchema = z.object({ params: empty, body: empty, query: z.object(pagination).passthrough() });
export const studentSchema = z.object({ params: z.object({ studentId: objectId }), query: empty, body: empty });
export const gapReportSchema = z.object({ params: z.object({ studentId: objectId, reportId: objectId }), query: empty, body: empty });
export const evidenceReviewSchema = z.object({
  params: z.object({ evidenceId: objectId }),
  query: empty,
  body: z.object({
    decision: z.enum(['mentor_approved', 'rejected', 'changes_requested']),
    comment: z.string().trim().max(2000).optional().default(''),
  }).superRefine((body, context) => {
    if (body.decision !== 'mentor_approved' && !body.comment) {
      context.addIssue({ code: 'custom', path: ['comment'], message: 'A comment is required for rejection or requested changes' });
    }
  }),
});
export const historySchema = z.object({
  params: empty,
  body: empty,
  query: z.object({
    ...pagination,
    decision: z.enum(['mentor_approved', 'approved', 'rejected', 'changes_requested']).optional(),
    studentId: objectId.optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
  }).passthrough(),
});
