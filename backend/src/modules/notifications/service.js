import { AppError, errorCodes } from '../../errors/index.js';
import { buildListQuery } from '../../common/query.js';
import { notificationsRepository } from './repository.js';

export const notificationsService = {
  async create(payload) {
    return notificationsRepository.create(payload);
  },

  async list(query) {
    const { filter, sort } = buildListQuery(
      {
        search: query.search,
        sortBy: query.sortBy || '-createdAt',
        filters: {
          ...(query.studentId ? { studentId: query.studentId } : {}),
          ...(query.category ? { category: query.category } : {}),
          ...(query.read ? { read: query.read === 'true' } : {}),
        },
      },
      ['title', 'body', 'category', 'priority'],
    );

    return {
      items: await notificationsRepository.list(filter, { sort, skip: query.skip, limit: query.limit }),
      total: await notificationsRepository.count(filter),
    };
  },

  async getById(id) {
    const notification = await notificationsRepository.findById(id);
    if (!notification) throw new AppError('Notification not found', 404, errorCodes.NOT_FOUND);
    return notification;
  },

  async markRead(id, read = true) {
    const notification = await notificationsRepository.updateById(id, {
      read,
      readAt: read ? new Date() : null,
    });
    if (!notification) throw new AppError('Notification not found', 404, errorCodes.NOT_FOUND);
    return notification;
  },

  async delete(id) {
    const notification = await notificationsRepository.deleteById(id);
    if (!notification) throw new AppError('Notification not found', 404, errorCodes.NOT_FOUND);
    return notification;
  },
};
