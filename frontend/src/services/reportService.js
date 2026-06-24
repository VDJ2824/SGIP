import { authApi, buildQuery, getStudentId } from './api';

export const getReports = (studentId = '') => authApi.get('/reports', { params: buildQuery({ studentId }) });
export const getProfileSummaryReport = (studentId = '') => authApi.get('/reports/profile-summary', { params: buildQuery({ studentId }) });
export const getResumeAnalysisReport = (studentId = '') => authApi.get('/reports/resume-analysis', { params: buildQuery({ studentId }) });
export const getLatestGapReport = (studentId = '') => authApi.get('/reports/gap-analysis/latest', { params: buildQuery({ studentId }) });
export const getGapReportHistory = (studentId = '') => authApi.get('/reports/gap-analysis/history', { params: buildQuery({ studentId }) });
export const getGapReport = (id, studentId = '') => authApi.get(`/reports/gap-analysis/${id}`, { params: buildQuery({ studentId }) });
export const getLatestRoadmapReport = (studentId = '') => authApi.get('/reports/roadmap/latest', { params: buildQuery({ studentId }) });
export const getSkillEvidenceReport = (studentId = '') => authApi.get('/reports/skill-evidence', { params: buildQuery({ studentId }) });
export const getProgressReport = (studentId = '') => authApi.get('/reports/progress', { params: buildQuery({ studentId }) });
export const getReportTrend = async (studentId = '') => {
  const response = await getProgressReport(studentId);
  return {
    ...response,
    data: (response.data?.readinessScoreTimeline || []).map((item) => ({
      label: new Date(item.date).toLocaleDateString(),
      readiness: item.value,
    })),
  };
};
export const getPlacementAnalytics = () =>
  authApi.get('/v1/placement-analytics/overview', {
    params: buildQuery({ studentId: getStudentId() }),
  });
export const compareGapReports = (previousReportId, currentReportId, studentId = '') =>
  authApi.get('/reports/compare', { params: buildQuery({ previousReportId, currentReportId, studentId }) });
export const downloadReportPdf = (type, studentId = '') =>
  authApi.get(`/reports/${type}/export/pdf`, { params: buildQuery({ studentId }), responseType: 'blob' });

export const reportLoaders = {
  'profile-summary': getProfileSummaryReport,
  'resume-analysis': getResumeAnalysisReport,
  'gap-analysis': getLatestGapReport,
  roadmap: getLatestRoadmapReport,
  'skill-evidence': getSkillEvidenceReport,
  progress: getProgressReport,
};

export function saveReportBlob(blob, type) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `sgip-${type}-report.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
