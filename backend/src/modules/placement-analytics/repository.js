import { createBaseRepository } from '../../common/baseRepository.js';
import { PlacementAnalytics } from './model.js';

const baseRepository = createBaseRepository(PlacementAnalytics);

export const placementAnalyticsRepository = {
  ...baseRepository,
  findByStudentId: (studentId) => PlacementAnalytics.findOne({ studentId }).sort({ createdAt: -1 }),
  upsertByStudentId: (studentId, payload) =>
    PlacementAnalytics.findOneAndUpdate({ studentId }, { studentId, ...payload }, { upsert: true, new: true, runValidators: true }),
};
