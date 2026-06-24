import { createBaseRepository } from '../../common/baseRepository.js';
import { Assessment, GapReport } from './model.js';

const gapReportBase = createBaseRepository(GapReport);
const assessmentBase = createBaseRepository(Assessment);

export const gapReportRepository = {
  ...gapReportBase,
  list: (filter = {}, options = {}) => gapReportBase.find(filter, options),
  count: (filter = {}) => gapReportBase.countDocuments(filter),
  findLatestForStudent: (studentId, roleId = null) =>
    GapReport.findOne({
      studentId,
      ...(roleId ? { roleId } : {}),
    }).sort({ createdAt: -1 }),
};

export const assessmentRepository = {
  ...assessmentBase,
  list: (filter = {}, options = {}) => assessmentBase.find(filter, options),
  count: (filter = {}) => assessmentBase.countDocuments(filter),
  findLatestForStudent: (studentId, roleId = null) =>
    Assessment.findOne({
      studentId,
      ...(roleId ? { roleId } : {}),
    }).sort({ createdAt: -1 }),
  findRecentForStudent: (studentId, limit = 6) =>
    Assessment.find({ studentId }).sort({ createdAt: -1 }).limit(limit),
};
