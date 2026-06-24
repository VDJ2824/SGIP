import { createBaseRepository } from '../../common/baseRepository.js';
import { CareerRole } from './model.js';

const baseRepository = createBaseRepository(CareerRole);

export const careerRoleCatalogRepository = {
  ...baseRepository,
  list: (filter = {}, options = {}) => baseRepository.find(filter, options),
  count: (filter = {}) => baseRepository.countDocuments(filter),
};
