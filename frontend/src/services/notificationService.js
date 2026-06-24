import { api, buildQuery, getStudentId } from './api';

export async function listNotifications(params = {}) {
  return api.get('/notifications', {
    params: buildQuery({ studentId: getStudentId(), ...params }),
  });
}

export async function createNotification(payload) {
  return api.post('/notifications', {
    studentId: getStudentId(),
    ...payload,
  });
}

export async function markNotificationRead(id, read = true) {
  return api.patch(`/notifications/${id}/read`, { read });
}

export async function deleteNotification(id) {
  return api.delete(`/notifications/${id}`);
}

