import { createBaseRepository } from '../../common/baseRepository.js';
import { Skill } from './model.js';

const baseRepository = createBaseRepository(Skill);

export const skillRepository = {
  ...baseRepository,
  findByUserAndNormalizedName: (userId, normalizedName) =>
    Skill.findOne({
      userId,
      normalizedName: { $in: [normalizedName, String(normalizedName).replaceAll('_', ' ')] },
    }),
  listByUserId: (userId, options = {}) => baseRepository.find({ userId }, options),
  updateOwnedLevel: (id, userId, level) =>
    Skill.findOneAndUpdate({ _id: id, userId }, { level }, { new: true, runValidators: true }),
};
