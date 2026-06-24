import { api, buildQuery } from './api';

export async function listRoles(params = {}) {
  return api.get('/career-roles', {
    params: buildQuery(params),
  });
}

export async function createRole(payload) {
  return api.post('/career-roles', payload);
}

export async function updateRole(id, payload) {
  return api.put(`/career-roles/${id}`, payload);
}

export async function deleteRole(id) {
  return api.delete(`/career-roles/${id}`);
}

export async function getRole(id) {
  return api.get(`/career-roles/${id}`);
}

export async function intelligentSearchRole(query) {
  return api.post('/career-roles/search', { query });
}
