import { asyncHandler } from '../../common/asyncHandler.js';
import { buildPaginationMeta, getPagination } from '../../common/pagination.js';
import { sendResponse } from '../../common/response.js';
import { mentorService } from './mentor.service.js';

function paginated(serviceCall) {
  return asyncHandler(async (req, res) => {
    const pagination = getPagination(req);
    const result = await serviceCall({ ...req.validated.query, ...pagination });
    return sendResponse(res, req, result.items, buildPaginationMeta({ ...pagination, total: result.total }));
  });
}

export const mentorController = {
  dashboard: asyncHandler(async (req, res) => sendResponse(res, req, await mentorService.dashboard(req.auth.userId))),
  students: paginated((query) => mentorService.listStudents(query.mentorId, query)),
  student: asyncHandler(async (req, res) => sendResponse(res, req, await mentorService.getStudent(req.auth.userId, req.params.studentId))),
  pendingEvidence: paginated((query) => mentorService.pendingEvidence(query.mentorId, query)),
  reviewEvidence: asyncHandler(async (req, res) => sendResponse(res, req, await mentorService.reviewEvidence(req.auth.user, req.params.evidenceId, req.validated.body))),
  reviewHistory: paginated((query) => mentorService.reviewHistory(query.mentorId, query)),
  latestGapReportsByRole: asyncHandler(async (req, res) =>
    sendResponse(res, req, await mentorService.latestGapReportsByRole(req.auth.userId, req.params.studentId))),
  gapReport: asyncHandler(async (req, res) => sendResponse(res, req, await mentorService.gapReport(req.auth.userId, req.params.studentId, req.params.reportId))),
  roadmap: asyncHandler(async (req, res) => sendResponse(res, req, await mentorService.roadmap(req.auth.userId, req.params.studentId))),
};

export function withMentorId(controller) {
  return (req, res, next) => {
    req.validated.query = { ...req.validated.query, mentorId: req.auth.userId, studentId: req.params.studentId };
    return controller(req, res, next);
  };
}
