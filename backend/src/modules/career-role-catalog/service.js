import { AppError, errorCodes } from '../../errors/index.js';
import { buildListQuery } from '../../common/query.js';
import { careerRoleCatalogRepository } from './repository.js';

export const careerRoleCatalogService = {
  async create(payload) {
    const existing = await careerRoleCatalogRepository.findOne({ slug: payload.slug });
    if (existing) {
      throw new AppError('Career role already exists', 409, errorCodes.CONFLICT);
    }
    return careerRoleCatalogRepository.create(payload);
  },

  async list(query) {
    const { filter, sort } = buildListQuery(
      {
        search: query.search,
        sortBy: query.sortBy || '-createdAt',
        filters: {
          ...(query.companyType ? { companyType: query.companyType } : {}),
          ...(query.level ? { level: query.level } : {}),
          ...(query.location ? { location: query.location } : {}),
          ...(query.isActive ? { isActive: query.isActive === 'true' } : {}),
        },
      },
      ['title', 'slug', 'companyType', 'level', 'location', 'description', 'searchKeywords', 'requirements.requiredSkills'],
    );

    return {
      items: await careerRoleCatalogRepository.list(filter, { sort, skip: query.skip, limit: query.limit }),
      total: await careerRoleCatalogRepository.count(filter),
    };
  },

  async getById(id) {
    const role = await careerRoleCatalogRepository.findById(id);
    if (!role) throw new AppError('Career role not found', 404, errorCodes.NOT_FOUND);
    return role;
  },

  async update(id, payload) {
    const role = await careerRoleCatalogRepository.updateById(id, payload);
    if (!role) throw new AppError('Career role not found', 404, errorCodes.NOT_FOUND);
    return role;
  },

  async delete(id) {
    const role = await careerRoleCatalogRepository.deleteById(id);
    if (!role) throw new AppError('Career role not found', 404, errorCodes.NOT_FOUND);
    return role;
  },
};
