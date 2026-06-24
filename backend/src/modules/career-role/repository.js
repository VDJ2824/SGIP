import { createBaseRepository } from '../../common/baseRepository.js';
import { CareerRole } from './model.js';

const baseRepository = createBaseRepository(CareerRole);

export const careerRoleRepository = {
  ...baseRepository,
  list: (filter = {}, options = {}) => baseRepository.find(filter, options),
  count: (filter = {}) => baseRepository.countDocuments(filter),
  findByNormalizedTitle: (normalizedTitle) =>
    CareerRole.findOne({
      $or: [
        { normalizedTitle },
        { slug: normalizedTitle.replace(/\s+/g, '-') },
        { title: { $regex: `^${normalizedTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } },
      ],
    }),
  findByAliasOrTitle: (normalizedTitle) =>
    CareerRole.findOne({
      $or: [{ normalizedTitle }, { aliases: { $regex: `^${normalizedTitle}$`, $options: 'i' } }, { title: { $regex: `^${normalizedTitle}$`, $options: 'i' } }],
    }),
  findCandidates: (tokens = [], limit = 40) => {
    if (!tokens.length) {
      return CareerRole.find({}).sort('-updatedAt').limit(limit);
    }

    const regexes = tokens.slice(0, 4).map((token) => new RegExp(token, 'i'));
    return CareerRole.find({
      $or: [
        { normalizedTitle: { $in: regexes } },
        { title: { $in: regexes } },
        { aliases: { $in: regexes } },
        { category: { $in: regexes } },
      ],
    })
      .sort('-updatedAt')
      .limit(limit);
  },
  upsertByNormalizedTitle: async (normalizedTitle, payload) => {
    const existing = await CareerRole.findOne({
      $or: [
        { normalizedTitle },
        { slug: payload.slug || normalizedTitle.replace(/\s+/g, '-') },
        { title: { $regex: `^${String(payload.title || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } },
      ],
    });

    if (existing) {
      return CareerRole.findByIdAndUpdate(existing._id, payload, { new: true, runValidators: true });
    }

    return CareerRole.create(payload);
  },
};
