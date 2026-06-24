import { api, buildQuery } from './api';

export function runGapAnalysis(careerRoleId) {
  return api.post('/gap-analysis/run', { careerRoleId });
}

export function getLatestGapAnalysis() {
  return api.get('/gap-analysis/latest');
}

export function getGapAnalysisReport(id) {
  return api.get(`/gap-analysis/${id}`);
}

export function getGapAnalysisHistory(params = {}) {
  return api.get('/gap-analysis/history', { params: buildQuery(params) });
}

export function archiveGapAnalysisReport(id) {
  return api.delete(`/gap-analysis/${id}`);
}
