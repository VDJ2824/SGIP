import { authApi, buildQuery } from './api';

export const getAdminDashboard = () => authApi.get('/admin/dashboard');
export const createMentor = (payload) => authApi.post('/admin/mentors', payload);
export const listMentors = (params = {}) => authApi.get('/admin/mentors', { params: buildQuery(params) });
export const updateMentor = (id, payload) => authApi.patch(`/admin/mentors/${id}`, payload);
export const updateMentorStatus = (id, isActive) => authApi.patch(`/admin/mentors/${id}/status`, { isActive });

export const listStudents = (params = {}) => authApi.get('/admin/students', { params: buildQuery(params) });
export const getStudent = (id) => authApi.get(`/admin/students/${id}`);
export const updateStudentStatus = (id, isActive) => authApi.patch(`/admin/students/${id}/status`, { isActive });
export const assignStudentMentor = (studentId, mentorId) =>
  authApi.patch(`/admin/students/${studentId}/assign-mentor`, { mentorId });

export const listAdminCareerRoles = (params = {}) => authApi.get('/admin/career-roles', { params: buildQuery(params) });
export const listPendingAiRoles = (params = {}) => authApi.get('/admin/career-roles/pending-ai', { params: buildQuery(params) });
export const createAdminCareerRole = (payload) => authApi.post('/admin/career-roles', payload);
export const updateAdminCareerRole = (id, payload) => authApi.patch(`/admin/career-roles/${id}`, payload);
export const archiveAdminCareerRole = (id) => authApi.delete(`/admin/career-roles/${id}`);
export const reviewAiRole = (id, payload) => authApi.patch(`/admin/career-roles/${id}/review`, payload);

export const getSkillTaxonomy = () => authApi.get('/admin/skill-taxonomy');
export const getAdminAnalytics = () => authApi.get('/admin/analytics');
export const listAdminActivity = (params = {}) => authApi.get('/admin/activity', { params: buildQuery(params) });
