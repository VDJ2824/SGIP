import { asyncHandler } from '../../common/asyncHandler.js';
import { sendResponse } from '../../common/response.js';
import { reportsService } from './service.js';
import { createReportPdf } from './reportsPdf.service.js';

async function studentIdFor(req) {
  return reportsService.authorize(req.auth.user, req.query.studentId);
}

export const reportsController = {
  list: asyncHandler(async (req, res) => {
    await studentIdFor(req);
    return sendResponse(res, req, reportsService.available());
  }),
  get: (type) => asyncHandler(async (req, res) => sendResponse(res, req, await reportsService.get(await studentIdFor(req), type))),
  gapHistory: asyncHandler(async (req, res) => sendResponse(res, req, await reportsService.gapHistory(await studentIdFor(req)))),
  gapById: asyncHandler(async (req, res) => sendResponse(res, req, await reportsService.gapById(await studentIdFor(req), req.params.id))),
  compare: asyncHandler(async (req, res) => sendResponse(res, req, await reportsService.compare(
    await studentIdFor(req), req.query.previousReportId, req.query.currentReportId,
  ))),
  exportPdf: asyncHandler(async (req, res) => {
    const studentId = await studentIdFor(req);
    const report = await reportsService.get(studentId, req.params.type);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="sgip-${req.params.type}-report.pdf"`);
    const doc = createReportPdf(report, report.studentName || '');
    doc.pipe(res);
    doc.end();
  }),
};
