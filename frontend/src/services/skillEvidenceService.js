import { api } from './api';

export async function listMySkillEvidence(params = {}) {
  return api.get('/skill-evidence/my', { params });
}

export async function listPendingSkillEvidence(params = {}) {
  return api.get('/skill-evidence/pending', { params });
}

export async function createSkillEvidence(payload) {
  const formData = new FormData();

  Object.entries(payload || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (key === 'relatedSkills' && Array.isArray(value)) {
      formData.append(key, JSON.stringify(value));
      return;
    }
    if (key === 'file' && value instanceof File) {
      formData.append('file', value);
      return;
    }
    formData.append(key, value);
  });

  return api.post('/skill-evidence', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export async function reviewSkillEvidence(id, payload) {
  return api.patch(`/skill-evidence/${id}/review`, payload);
}

export async function deleteSkillEvidence(id) {
  return api.delete(`/skill-evidence/${id}`);
}
