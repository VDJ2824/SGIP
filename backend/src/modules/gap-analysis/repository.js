import { createBaseRepository } from '../../common/baseRepository.js';
import { GapAnalysisReport } from './model.js';

const baseRepository = createBaseRepository(GapAnalysisReport);

export const gapAnalysisRepository = {
  ...baseRepository,
  findLatestForUser: (userId) =>
    GapAnalysisReport.findOne({ userId, status: 'generated' }).sort({ createdAt: -1 }),
  findOwnedById: (id, userId) => GapAnalysisReport.findOne({ _id: id, userId }),
  listForUser: (userId, options = {}) => {
    const query = GapAnalysisReport.find({ userId });
    if (options.sort) query.sort(options.sort);
    if (options.skip !== undefined) query.skip(options.skip);
    if (options.limit !== undefined) query.limit(options.limit);
    return query;
  },
  countForUser: (userId) => GapAnalysisReport.countDocuments({ userId }),
  archiveOwned: (id, userId) =>
    GapAnalysisReport.findOneAndUpdate({ _id: id, userId }, { status: 'archived' }, { new: true }),
};
