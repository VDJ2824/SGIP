import { api, buildQuery } from './api';

export function generateRoadmap(gapReportId) {
  return api.post('/roadmap/generate', { gapReportId });
}

export function getLatestRoadmap() {
  return api.get('/roadmap/latest');
}

export function getRoadmap(id) {
  return api.get(`/roadmap/${id}`);
}

export function getRoadmapHistory(params = {}) {
  return api.get('/roadmap/history', { params: buildQuery(params) });
}

export function updateRoadmapTask(taskId, status) {
  return api.patch(`/roadmap/task/${taskId}`, { status });
}

export function downloadRoadmapPdf(roadmapId) {
  return api.get(`/roadmap/${roadmapId}/export/pdf`, {
    responseType: 'blob',
  });
}

export const listRoadmaps = getRoadmapHistory;
