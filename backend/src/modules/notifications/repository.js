import { createBaseRepository } from '../../common/baseRepository.js';
import { Notification } from './model.js';

const baseRepository = createBaseRepository(Notification);

export const notificationsRepository = {
  ...baseRepository,
  list: (filter = {}, options = {}) => baseRepository.find(filter, options),
  count: (filter = {}) => baseRepository.countDocuments(filter),
};
