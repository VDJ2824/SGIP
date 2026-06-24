import { asyncHandler } from '../../common/asyncHandler.js';
import { buildPaginationMeta, getPagination } from '../../common/pagination.js';
import { sendCreated, sendResponse } from '../../common/response.js';
import { AppError, errorCodes } from '../../errors/index.js';
import { studentProfileService } from './service.js';
import { reportsService } from '../reports/service.js';

async function snapshotProfile(profile) {
  try {
    await reportsService.snapshotProfile(String(profile.userId || profile.studentId), profile);
  } catch {
    // Reporting history must not block profile saves.
  }
}

function resolveStudentIdentity(req, payload = {}) {
  const studentId = String(
    req.auth?.userId ||
      req.query.studentId ||
      payload.studentId ||
      payload.userId ||
      '',
  ).trim();

  if (!studentId) {
    throw new AppError('studentId is required', 400, errorCodes.VALIDATION_ERROR);
  }

  return {
    studentId,
    userId: String(req.auth?.userId || payload.userId || studentId).trim(),
  };
}

export const studentProfileController = {
  create: asyncHandler(async (req, res) => {
    const identity = resolveStudentIdentity(req, req.validated.body);
    const profile = await studentProfileService.create({
      ...req.validated.body,
      ...identity,
    });
    await snapshotProfile(profile);
    return sendCreated(res, req, profile);
  }),

  list: asyncHandler(async (req, res) => {
    const pagination = getPagination(req);
    const { items, total } = await studentProfileService.list({
      ...req.query,
      skip: pagination.skip,
      limit: pagination.limit,
    });
    return sendResponse(res, req, items, buildPaginationMeta({ ...pagination, total }));
  }),

  getById: asyncHandler(async (req, res) => {
    const profile = await studentProfileService.getById(req.params.id);
    return sendResponse(res, req, profile);
  }),

  getMe: asyncHandler(async (req, res) => {
    const identity = resolveStudentIdentity(req);
    const profile = await studentProfileService.getOrCreateByStudentId(identity.studentId, {
      userId: identity.userId,
      personal: {
        fullName: req.auth?.user?.name || '',
        email: req.auth?.user?.email || '',
      },
    });
    return sendResponse(res, req, profile);
  }),

  update: asyncHandler(async (req, res) => {
    const profile = await studentProfileService.update(req.params.id, req.validated.body);
    await snapshotProfile(profile);
    return sendResponse(res, req, profile);
  }),

  updateMe: asyncHandler(async (req, res) => {
    const identity = resolveStudentIdentity(req, req.validated.body);
    const profile = await studentProfileService.upsertByStudentId(identity.studentId, {
      ...req.validated.body,
      ...identity,
    });
    await snapshotProfile(profile);
    return sendResponse(res, req, profile);
  }),

  delete: asyncHandler(async (req, res) => {
    const profile = await studentProfileService.delete(req.params.id);
    return sendResponse(res, req, { deleted: true, id: profile._id });
  }),
};
