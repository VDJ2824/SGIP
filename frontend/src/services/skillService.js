import { api } from './api';

export async function listMySkills() {
  try {
    return await api.get('/skills/my');
  } catch (error) {
    if (error?.status === 404) {
      return api.get('/skill-evidence/skills/my');
    }

    throw error;
  }
}

export async function updateSkillLevel(id, level) {
  return api.patch(`/skills/${id}/level`, { level: Number(level) });
}
