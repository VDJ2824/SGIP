import { asyncHandler } from '../../common/asyncHandler.js';
import { buildPaginationMeta, getPagination } from '../../common/pagination.js';
import { sendCreated, sendResponse } from '../../common/response.js';
import { adminService } from './admin.service.js';

function paginated(serviceCall) {
  return asyncHandler(async (req, res) => {
    const pagination = getPagination(req);
    const result = await serviceCall({ ...req.validated.query, ...pagination }, req.auth);
    return sendResponse(res, req, result.items, buildPaginationMeta({ ...pagination, total: result.total }));
  });
}

export const adminController = {
  dashboard: asyncHandler(async (req, res) => sendResponse(res, req, await adminService.dashboard())),
  createMentor: asyncHandler(async (req, res) => sendCreated(res, req, await adminService.createMentor(req.validated.body, req.auth))),
  listMentors: paginated((query) => adminService.listMentors(query)),
  updateMentor: asyncHandler(async (req, res) => sendResponse(res, req, await adminService.updateMentor(req.params.id, req.validated.body, req.auth))),
  updateMentorStatus: asyncHandler(async (req, res) => sendResponse(res, req, await adminService.updateUserStatus(req.params.id, 'mentor', req.validated.body.isActive, req.auth))),
  listStudents: paginated((query) => adminService.listStudents(query)),
  getStudent: asyncHandler(async (req, res) => sendResponse(res, req, await adminService.getStudent(req.params.id))),
  updateStudentStatus: asyncHandler(async (req, res) => sendResponse(res, req, await adminService.updateUserStatus(req.params.id, 'student', req.validated.body.isActive, req.auth))),
  assignMentor: asyncHandler(async (req, res) => sendResponse(res, req, await adminService.assignMentor(req.params.id, req.validated.body.mentorId, req.auth))),
  listCareerRoles: paginated((query) => adminService.listCareerRoles(query)),
  pendingAiRoles: paginated((query) => adminService.listCareerRoles({ ...query, source: 'ai_generated', reviewStatus: 'pending' })),
  createCareerRole: asyncHandler(async (req, res) => sendCreated(res, req, await adminService.createCareerRole(req.validated.body, req.auth))),
  updateCareerRole: asyncHandler(async (req, res) => sendResponse(res, req, await adminService.updateCareerRole(req.params.id, req.validated.body, req.auth))),
  archiveCareerRole: asyncHandler(async (req, res) => sendResponse(res, req, await adminService.archiveCareerRole(req.params.id, req.auth))),
  reviewCareerRole: asyncHandler(async (req, res) => sendResponse(res, req, await adminService.reviewCareerRole(req.params.id, req.validated.body, req.auth))),
  skillTaxonomy: asyncHandler(async (req, res) => sendResponse(res, req, adminService.skillTaxonomy())),
  analytics: asyncHandler(async (req, res) => sendResponse(res, req, await adminService.analytics())),
  activity: paginated((query) => adminService.activity(query)),
};
