import { api, buildQuery, getStudentId } from './api';

export async function getProfile() {
  return api.get('/student-profile/me', {
    params: buildQuery({ studentId: getStudentId() }),
  });
}

export async function createProfile(payload) {
  return api.post('/student-profile', payload);
}

export async function updateProfile(id, payload) {
  return api.put(`/student-profile/${id}`, payload);
}

export async function updateMyProfile(payload) {
  return api.put('/student-profile/me', payload, {
    params: buildQuery({ studentId: getStudentId() }),
  });
}

export async function deleteProfile(id) {
  return api.delete(`/student-profile/${id}`);
}

export async function listProfiles(params = {}) {
  return api.get('/student-profile', {
    params: buildQuery(params),
  });
}

