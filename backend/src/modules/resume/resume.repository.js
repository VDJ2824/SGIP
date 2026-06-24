import { createBaseRepository } from '../../common/baseRepository.js';
import { Resume } from './resume.model.js';

const baseRepository = createBaseRepository(Resume);

export const resumeRepository = {
  ...baseRepository,
  listByUserId: (userId, options = {}) => baseRepository.find({ userId }, options),
  countByUserId: (userId) => baseRepository.countDocuments({ userId }),
  findOwnedById: (id, userId) => Resume.findOne({ _id: id, userId }),
  findLatestByUserId: (userId) => Resume.findOne({ userId }).sort({ createdAt: -1 }),
  deleteManyByUserId: (userId, excludeId = null) =>
    excludeId
      ? Resume.deleteMany({ userId, _id: { $ne: excludeId } })
      : Resume.deleteMany({ userId }),
};
