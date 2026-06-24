import { api, buildQuery } from './api';

export async function uploadResume(file, onUploadProgress) {
  const formData = new FormData();
  formData.append('resume', file);

  return api.post('/resumes/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  });
}

export async function extractResumeSkills(id) {
  return api.post(`/resumes/${id}/extract-skills`);
}

export async function reviewResumeSkills(id, skills) {
  return api.patch(`/resumes/${id}/review`, { skills });
}

export async function listResumes(params = {}) {
  return api.get('/resumes', {
    params: buildQuery(params),
  });
}

export async function getResume(id, params = {}) {
  return api.get(`/resumes/${id}`, {
    params: buildQuery(params),
  });
}

export async function deleteResume(id) {
  return api.delete(`/resumes/${id}`);
}
