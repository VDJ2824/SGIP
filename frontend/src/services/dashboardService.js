import { getProfile } from './profileService';
import { listMySkillEvidence } from './skillEvidenceService';
import { listRoles } from './roleService';
import { getLatestRoadmap } from './roadmapService';
import { listNotifications } from './notificationService';
import { getReportTrend, getPlacementAnalytics } from './reportService';
import { listResumes } from './resumeService';
import { api, buildQuery, getStudentId } from './api';
import { getLatestGapAnalysis } from './gapAnalysisService';

export async function getGapAnalysis() {
  return getLatestGapAnalysis();
}

export async function getDashboardSnapshot() {
  const results = await Promise.allSettled([
    getProfile(),
    listMySkillEvidence({ limit: 100 }),
    listRoles({ limit: 100 }),
    getLatestRoadmap(),
    listNotifications({ limit: 100 }),
    getGapAnalysis(),
    getReportTrend(),
    getPlacementAnalytics(),
    listResumes({ limit: 1 }),
  ]);

  const [profileResponse, evidenceResponse, rolesResponse, roadmapResponse, notificationResponse, gapResponse, trendResponse, analyticsResponse, resumesResponse] = results.map((result) =>
    result.status === 'fulfilled' ? result.value : null,
  );

  return {
    profile: profileResponse?.data || null,
    skillEvidence: evidenceResponse?.data || [],
    roles: rolesResponse?.data || [],
    roadmap: roadmapResponse?.data || null,
    notifications: notificationResponse?.data || [],
    gapAnalysis: gapResponse?.data || null,
    trend: trendResponse?.data || [],
    analytics: analyticsResponse?.data || null,
    resumes: resumesResponse?.data || [],
  };
}
