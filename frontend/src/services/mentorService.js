import { authApi, buildQuery } from './api';

export const getMentorDashboard = () => authApi.get('/mentor/dashboard');
export const listMentorStudents = (params = {}) => authApi.get('/mentor/students', { params: buildQuery(params) });
export const getMentorStudent = (studentId) => authApi.get(`/mentor/students/${studentId}`);
export const listMentorPendingEvidence = (params = {}) => authApi.get('/mentor/evidence/pending', { params: buildQuery(params) });
export const reviewMentorEvidence = (evidenceId, payload) => authApi.patch(`/mentor/evidence/${evidenceId}/review`, payload);
export const listMentorReviewHistory = (params = {}) => authApi.get('/mentor/reviews/history', { params: buildQuery(params) });
export const getMentorStudentLatestGapReportsByRole = (studentId) =>
  authApi.get(`/mentor/students/${studentId}/gap-reports`);
export const getMentorStudentGapReport = (studentId, reportId) =>
  authApi.get(`/mentor/students/${studentId}/gap-reports/${reportId}`);
export const getMentorStudentRoadmap = (studentId) => authApi.get(`/mentor/students/${studentId}/roadmap`);
