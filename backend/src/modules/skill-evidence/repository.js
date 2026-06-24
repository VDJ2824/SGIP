import { createBaseRepository } from '../../common/baseRepository.js';
import { SkillEvidence } from './model.js';

const baseRepository = createBaseRepository(SkillEvidence);

export const skillEvidenceRepository = {
  ...baseRepository,
  list: (filter = {}, options = {}) => baseRepository.find(filter, options),
  count: (filter = {}) => baseRepository.countDocuments(filter),
  findByUserAndSkillId: (userId, skillId, options = {}) =>
    baseRepository.find({ userId, skillId }, options),
  findPendingForUsers: (userIds = [], options = {}) =>
    baseRepository.find({ userId: { $in: userIds }, verificationStatus: 'pending' }, options),
};
