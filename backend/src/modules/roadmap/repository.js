import { createBaseRepository } from '../../common/baseRepository.js';
import { Roadmap } from './model.js';

const baseRepository = createBaseRepository(Roadmap);

export const roadmapRepository = {
  ...baseRepository,
  findLatestForUser: (userId) =>
    Roadmap.findOne({ userId, gapReportId: { $exists: true }, status: { $ne: 'archived' } }).sort({ createdAt: -1 }),
  findOwnedById: (id, userId) => Roadmap.findOne({ _id: id, userId }),
  listForUser: (userId, options = {}) => {
    const query = Roadmap.find({ userId, gapReportId: { $exists: true } });
    if (options.sort) query.sort(options.sort);
    if (options.skip !== undefined) query.skip(options.skip);
    if (options.limit !== undefined) query.limit(options.limit);
    return query;
  },
  countForUser: (userId) => Roadmap.countDocuments({ userId, gapReportId: { $exists: true } }),
};
