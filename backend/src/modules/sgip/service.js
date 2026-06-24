import { AppError, errorCodes } from '../../errors/index.js';
import { gapReportRepository, assessmentRepository } from './repository.js';
import { studentProfileRepository } from '../student-profile/repository.js';
import { skillEvidenceRepository } from '../skill-evidence/repository.js';
import { careerRoleRepository } from '../career-role/repository.js';
import { roadmapRepository } from '../roadmap/repository.js';
import { notificationsRepository } from '../notifications/repository.js';
import { placementAnalyticsRepository } from '../placement-analytics/repository.js';

function toPlain(doc) {
  if (!doc) return null;
  if (Array.isArray(doc)) return doc.map((item) => toPlain(item));
  return typeof doc.toObject === 'function' ? doc.toObject() : doc;
}

function resolveStudentId(studentId) {
  const resolved = String(studentId || '').trim();
  if (!resolved) {
    throw new AppError('studentId is required', 400, errorCodes.VALIDATION_ERROR);
  }
  return resolved;
}

function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, Math.round(value || 0)));
}

function normalizeSkillKey(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function normalizeLabel(value = '') {
  return String(value)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildSkillDisplay(value = '') {
  const normalized = normalizeLabel(value);
  if (!normalized) return '';
  return normalized
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function splitValues(values = []) {
  return values
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .flatMap((value) => String(value || '').split(/[,/|;]/g))
    .map((value) => value.trim())
    .filter(Boolean);
}

function extractRequiredSkillNames(role = {}) {
  if (Array.isArray(role.requiredSkills)) {
    return role.requiredSkills.map((skill) => skill?.name || skill).filter(Boolean);
  }

  return (role.requirements?.requiredSkills || []).map((skill) => skill?.name || skill).filter(Boolean);
}

function extractPreferredSkillNames(role = {}) {
  if (Array.isArray(role.preferredSkills)) {
    return role.preferredSkills.map((skill) => skill?.name || skill).filter(Boolean);
  }

  return (role.requirements?.preferredSkills || []).map((skill) => skill?.name || skill).filter(Boolean);
}

function collectRoadmapProgress(roadmaps = []) {
  if (!roadmaps.length) return 0;
  const average = roadmaps.reduce((sum, roadmap) => sum + Number(roadmap.progress || 0), 0) / roadmaps.length;
  return clamp(average);
}

function monthLabel(value) {
  if (!value) return 'Now';
  return new Intl.DateTimeFormat('en-US', { month: 'short' }).format(new Date(value));
}

function buildProfileCompleteness(profile = {}) {
  const checklist = [
    profile.personal?.fullName,
    profile.personal?.email,
    profile.personal?.phone,
    profile.personal?.location,
    profile.personal?.bio,
    profile.personal?.targetRole,
    profile.personal?.targetRoleId,
    profile.education?.institution,
    profile.education?.degree,
    profile.education?.semester,
    profile.education?.cgpa,
    profile.education?.graduationYear,
    (profile.experience || []).length,
    (profile.certifications || []).length,
    (profile.resume?.fileName || profile.resume?.url),
    (profile.topSkills || []).length,
    profile.personal?.github,
    profile.personal?.linkedin,
  ];

  const filled = checklist.filter((value) => Boolean(value)).length;
  return clamp((filled / checklist.length) * 100);
}

function buildCandidateSkillPool(profile = {}, evidence = []) {
  const pool = new Map();
  const evidenceWeight = {
    approved: 1,
    pending: 0.4,
    changes_requested: 0.2,
    rejected: 0,
    draft: 0,
  };
  const levelWeight = {
    Beginner: 0.45,
    Intermediate: 0.7,
    Advanced: 0.95,
  };

  const addSkill = (skill, source, score, level = '') => {
    const key = normalizeSkillKey(skill);
    if (!key) return;
    const existing = pool.get(key);
    const next = {
      skill: buildSkillDisplay(skill),
      score: clamp(Math.max(existing?.score || 0, score)),
      source: existing?.source ? `${existing.source}, ${source}` : source,
      level: existing?.level || level,
    };
    pool.set(key, next);
  };

  splitValues(profile.topSkills || []).forEach((skill) => addSkill(skill, 'profile', 60));
  (profile.experience || []).forEach((experience) =>
    splitValues(experience.highlights || []).forEach((highlight) => addSkill(highlight, experience.role || 'experience', 45)),
  );

  evidence.forEach((item) => {
    const status = item.verificationStatus || item.status || 'draft';
    const weight = evidenceWeight[status] ?? 0;
    if (weight <= 0) return;

    const confidence = Math.min(1, Math.max(0, Number(item.confidence ?? (item.score ? item.score / 100 : 0.6))));
    const levelScore = levelWeight[item.level] ?? 0.65;
    const recency = recencyScoreFromDate(item.issueDate || item.submittedAt || item.updatedAt || item.createdAt) / 100;
    const evidenceScore = clamp((confidence * 55 + levelScore * 25 + recency * 20) * weight);
    addSkill(item.skillLabel || item.skillName, status || 'evidence', evidenceScore, item.level || '');
  });

  return [...pool.values()];
}

function findBestSkillMatch(targetSkill, candidateSkills = []) {
  const targetKey = normalizeSkillKey(targetSkill);
  let best = null;

  candidateSkills.forEach((candidate) => {
    const candidateKey = normalizeSkillKey(candidate.skill);
    const exactMatch = candidateKey === targetKey;
    const containsMatch =
      !exactMatch && (candidateKey.includes(targetKey) || targetKey.includes(candidateKey)) && targetKey.length > 2;
    const score = exactMatch ? 100 : containsMatch ? 85 : 0;

    if (!score) return;
    if (!best || score > best.score || (score === best.score && candidate.score > best.score)) {
      best = {
        skill: buildSkillDisplay(targetSkill),
        score,
        source: candidate.source,
        level: candidate.level,
      };
    }
  });

  return best;
}

function buildSkillMatches(requiredSkills = [], preferredSkills = [], candidateSkills = []) {
  const requiredMatches = requiredSkills
    .map((skill) => findBestSkillMatch(skill, candidateSkills))
    .filter(Boolean)
    .map((match) => ({ ...match, source: 'required' }));

  const preferredMatches = preferredSkills
    .map((skill) => findBestSkillMatch(skill, candidateSkills))
    .filter(Boolean)
    .map((match) => ({ ...match, source: 'preferred', score: clamp(match.score - 5) }));

  return [...requiredMatches, ...preferredMatches].sort((a, b) => b.score - a.score);
}

function buildMissingSkills(requiredSkills = [], candidateSkills = []) {
  return requiredSkills
    .map((skill) => {
      const match = findBestSkillMatch(skill, candidateSkills);
      const current = match?.score || 0;
      const gap = clamp(100 - current);
      return {
        skill: buildSkillDisplay(skill),
        current,
        target: 100,
        gap,
        priority: gap >= 40 ? 'High' : gap >= 20 ? 'Medium' : 'Low',
        reason: current ? 'The skill exists, but it still lacks strong approved evidence.' : 'No evidence found for this skill yet.',
      };
    })
    .filter((item) => item.gap > 0)
    .sort((a, b) => b.gap - a.gap);
}

function calculateEvidenceStrength(evidence = []) {
  if (!evidence.length) return 0;
  const weights = {
    approved: 1,
    pending: 0.4,
    changes_requested: 0.2,
    rejected: 0,
    draft: 0,
  };

  const weightedStatuses = evidence.reduce((sum, item) => sum + (weights[item.verificationStatus || item.status || 'draft'] ?? 0), 0);
  const artifactCount = evidence.filter((item) => item.fileUrl || item.externalLink).length;
  const recentCount = evidence.filter((item) => Date.now() - new Date(item.issueDate || item.submittedAt || item.updatedAt || item.createdAt || Date.now()).getTime() <= 90 * 24 * 60 * 60 * 1000).length;
  const averageConfidence = evidence.reduce((sum, item) => sum + Number(item.confidence ?? (item.score ? item.score / 100 : 0.5)), 0) / evidence.length;

  return clamp(
    (weightedStatuses / evidence.length) * 55 +
      (artifactCount / evidence.length) * 20 +
      (recentCount / evidence.length) * 15 +
      averageConfidence * 10,
  );
}

function recencyScoreFromDate(date) {
  if (!date) return 0;
  const days = (Date.now() - new Date(date).getTime()) / (24 * 60 * 60 * 1000);
  if (days <= 7) return 100;
  if (days <= 14) return 88;
  if (days <= 30) return 72;
  if (days <= 60) return 55;
  if (days <= 120) return 35;
  return 20;
}

function calculateTrustAndRecency(evidence = []) {
  if (!evidence.length) return 0;
  const approvedRatio = evidence.filter((item) => item.verificationStatus === 'approved' || item.status === 'verified').length / evidence.length;
  const latestEvidence = evidence
    .map((item) => new Date(item.issueDate || item.submittedAt || item.updatedAt || item.createdAt || 0))
    .sort((a, b) => b - a)[0];

  return clamp(approvedRatio * 60 + recencyScoreFromDate(latestEvidence) * 0.4);
}

function calculateCoreEligibility(requiredSkills = [], candidateSkills = []) {
  if (!requiredSkills.length) return 0;
  const matched = requiredSkills.filter((skill) => findBestSkillMatch(skill, candidateSkills)).length;
  return clamp((matched / requiredSkills.length) * 100);
}

function calculateCompatibility(profile = {}, role = {}, roadmapProgress = 0, candidateSkills = []) {
  const titleAlignment = (() => {
    const targetRole = normalizeSkillKey(profile.personal?.targetRole || '');
    const roleTitle = normalizeSkillKey(role.title || '');
    if (!targetRole || !roleTitle) return 35;
    if (targetRole === roleTitle) return 100;
    if (targetRole.includes(roleTitle) || roleTitle.includes(targetRole)) return 85;
    const targetTokens = normalizeLabel(profile.personal?.targetRole || '').split(' ');
    return targetTokens.some((token) => normalizeSkillKey(role.title || '').includes(normalizeSkillKey(token))) ? 65 : 40;
  })();

  const preferredSkills = extractPreferredSkillNames(role);
  const preferredMatches = preferredSkills.length
    ? preferredSkills.filter((skill) => findBestSkillMatch(skill, candidateSkills)).length / preferredSkills.length
    : 0.4;
  const roadmapAlignment = roadmapProgress || 0;

  return clamp(titleAlignment * 0.5 + preferredMatches * 100 * 0.3 + roadmapAlignment * 0.2);
}

function calculateConfidence({
  profileCompleteness = 0,
  evidenceStrength = 0,
  trustAndRecency = 0,
  matchingSkillsCount = 0,
  evidenceCount = 0,
}) {
  return clamp(
    15 +
      profileCompleteness * 0.18 +
      evidenceStrength * 0.3 +
      trustAndRecency * 0.22 +
      Math.min(15, matchingSkillsCount * 3) +
      Math.min(10, evidenceCount * 1.5),
  );
}

function buildRecommendations({
  profileCompleteness,
  coreEligibility,
  evidenceStrength,
  compatibility,
  trustAndRecency,
  missingSkills,
  roadmapProgress,
}) {
  const recommendations = [];

  if (profileCompleteness < 80) {
    recommendations.push('Complete the missing profile sections to improve the reliability of your assessment.');
  }
  if (coreEligibility < 75 && missingSkills.length) {
    recommendations.push(`Prioritize ${missingSkills[0].skill} first because it is the largest core requirement gap.`);
  }
  if (evidenceStrength < 70) {
    recommendations.push('Attach verified evidence links or files to strengthen your skill proof.');
  }
  if (trustAndRecency < 60) {
    recommendations.push('Refresh older evidence with a recent project or certification update.');
  }
  if (compatibility < 70) {
    recommendations.push('Align your roadmap milestones with the target role requirements and responsibilities.');
  }
  if (roadmapProgress < 60) {
    recommendations.push('Complete the next roadmap milestone to turn learning progress into placement readiness.');
  }

  if (!recommendations.length) {
    recommendations.push('Keep collecting high-quality evidence and updating the roadmap to maintain momentum.');
  }

  return recommendations.slice(0, 5);
}

function buildReadinessTrend(assessments = [], analyticsSnapshot = {}) {
  const sorted = [...assessments]
    .map((item) => toPlain(item))
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const points = sorted.slice(-6);
  if (!points.length) {
    return [
      {
        label: monthLabel(new Date()),
        readiness: analyticsSnapshot.roleReadinessScore || 0,
        evidence: analyticsSnapshot.evidenceCoverage || 0,
        roadmap: analyticsSnapshot.roadmapCompletion || 0,
        assessment: analyticsSnapshot.assessmentImprovement || 0,
      },
    ];
  }

  return points.map((assessment) => ({
    label: monthLabel(assessment.createdAt),
    readiness: assessment.readinessScore || 0,
    evidence: assessment.meta?.evidenceCoverage ?? analyticsSnapshot.evidenceCoverage ?? 0,
    roadmap: assessment.meta?.roadmapCompletion ?? analyticsSnapshot.roadmapCompletion ?? 0,
    assessment: assessment.confidenceScore || assessment.meta?.confidenceScore || 0,
  }));
}

async function resolveRole(profile, roleId) {
  const requestedRoleId = roleId || profile?.personal?.targetRoleId || '';
  if (requestedRoleId) {
    const byId = await careerRoleRepository.findById(requestedRoleId);
    if (byId) return toPlain(byId);
  }

  const targetRole = profile?.personal?.targetRole || '';
  const activeRoles = await careerRoleRepository.list({}, { sort: 'title', limit: 100 });
  const activePlain = toPlain(activeRoles) || [];

  if (!targetRole) {
    return null;
  }

  const normalizedTarget = normalizeSkillKey(targetRole);
  const exact = activePlain.find((role) => normalizeSkillKey(role.title || '') === normalizedTarget);
  if (exact) return exact;

  const fuzzy = activePlain.find((role) => {
    const roleKey = normalizeSkillKey(role.title || '');
    return roleKey.includes(normalizedTarget) || normalizedTarget.includes(roleKey);
  });

  return fuzzy || null;
}

async function loadStudentContext(studentId, roleId) {
  const [profile, evidence, roadmaps, notifications] = await Promise.all([
    studentProfileRepository.findByStudentId(studentId),
    skillEvidenceRepository.list({ userId: studentId }, { sort: '-createdAt', limit: 100 }),
    roadmapRepository.list({ studentId }, { sort: '-createdAt', limit: 100 }),
    notificationsRepository.list({ studentId }, { sort: '-createdAt', limit: 100 }),
  ]);

  const plainProfile =
    toPlain(profile) || {
      studentId,
      userId: studentId,
      personal: {
        fullName: '',
        email: '',
        phone: '',
        location: '',
        github: '',
        linkedin: '',
        bio: '',
        targetRole: '',
        targetRoleId: '',
        targetRoleSource: '',
        targetRoleReviewStatus: '',
        targetRoleSelectedAt: null,
      },
      education: {},
      experience: [],
      certifications: [],
      resume: {},
      topSkills: [],
      strengths: [],
      improvementAreas: [],
      overallReadiness: 0,
    };
  const plainEvidence = toPlain(evidence) || [];
  const plainRoadmaps = toPlain(roadmaps) || [];
  const plainNotifications = toPlain(notifications) || [];
  const role = await resolveRole(plainProfile || {}, roleId);

  return {
    studentId,
    profile: plainProfile,
    evidence: plainEvidence,
    roadmaps: plainRoadmaps,
    notifications: plainNotifications,
    role,
  };
}

async function syncAssessmentAndReport(context, analysis, analyticsSnapshot) {
  const assessment = await assessmentRepository.create({
    studentId: context.studentId,
    roleId: context.role?._id || null,
    roleTitle: context.role?.title || '',
    readinessScore: analysis.readinessScore,
    confidenceScore: analysis.confidenceScore,
    profileCompleteness: analysis.profileCompleteness,
    coreEligibility: analysis.coreEligibility,
    evidenceStrength: analysis.evidenceStrength,
    compatibility: analysis.compatibility,
    trustAndRecency: analysis.trustAndRecency,
    missingSkillsCount: analysis.missingSkills.length,
    matchingSkillsCount: analysis.matchingSkills.length,
    status: 'completed',
    meta: {
      evidenceCoverage: analyticsSnapshot.evidenceCoverage,
      roadmapCompletion: analyticsSnapshot.roadmapCompletion,
      assessmentImprovement: analyticsSnapshot.assessmentImprovement,
      placementConversion: analyticsSnapshot.placementConversion,
      confidenceScore: analysis.confidenceScore,
    },
  });

  const gapReport = await gapReportRepository.create({
    studentId: context.studentId,
    roleId: context.role?._id || null,
    roleTitle: context.role?.title || '',
    readinessScore: analysis.readinessScore,
    confidenceScore: analysis.confidenceScore,
    profileCompleteness: analysis.profileCompleteness,
    coreEligibility: analysis.coreEligibility,
    evidenceStrength: analysis.evidenceStrength,
    compatibility: analysis.compatibility,
    trustAndRecency: analysis.trustAndRecency,
    matchingSkills: analysis.matchingSkills,
    missingSkills: analysis.missingSkills,
    recommendations: analysis.recommendations,
    readinessComponents: analysis.readinessComponents,
    assessmentId: assessment._id,
    meta: {
      candidateSkillCount: analysis.candidateSkillCount,
      evidenceCount: analysis.evidenceCount,
      roadmapProgress: analyticsSnapshot.roadmapCompletion,
      placementConversion: analyticsSnapshot.placementConversion,
    },
  });

  await assessmentRepository.updateById(assessment._id, {
    meta: {
      ...assessment.meta,
      gapReportId: gapReport._id,
    },
  });

  return { assessment, gapReport };
}

async function syncPlacementAnalytics(studentId, analysis, assessments, roadmaps = [], evidence = []) {
  const latestAssessment = assessments[0] || null;
  const previousAssessment = assessments[1] || null;
  const roadmapCompletion = collectRoadmapProgress(roadmaps);
  const evidenceCoverage = analysis.missingSkills.length
    ? clamp((analysis.matchingSkills.length / (analysis.matchingSkills.length + analysis.missingSkills.length)) * 100)
    : clamp(Math.min(100, evidence.length * 20));
  const placementConversion = assessments.length
    ? clamp((assessments.filter((item) => (item.readinessScore || 0) >= 75).length / assessments.length) * 100)
    : clamp(analysis.readinessScore >= 75 ? 100 : analysis.readinessScore * 0.8);
  const assessmentImprovement = latestAssessment && previousAssessment
    ? clamp((latestAssessment.readinessScore || 0) - (previousAssessment.readinessScore || 0), -100, 100)
    : analysis.readinessScore;

  const trend = buildReadinessTrend(assessments, {
    roleReadinessScore: analysis.readinessScore,
    evidenceCoverage,
    roadmapCompletion,
    assessmentImprovement,
  });

  return placementAnalyticsRepository.upsertByStudentId(studentId, {
    readinessTrend: trend,
    roleReadinessScore: analysis.readinessScore,
    evidenceCoverage,
    roadmapCompletion,
    assessmentImprovement,
    placementConversion,
  });
}

function buildReportSummaries(gapReport, analytics, roadmap = [], notifications = [], latestAssessment = null) {
  if (!gapReport) return [];

  const latestRoadmap = roadmap[0] || {};
  const unreadCount = notifications.filter((item) => !item.read).length;
  const reportDate = latestAssessment?.createdAt || gapReport.createdAt || new Date();

  return [
    {
      id: String(gapReport._id),
      title: 'Placement Readiness Snapshot',
      description: `Readiness score ${gapReport.readinessScore}% with confidence ${gapReport.confidenceScore}% and ${gapReport.missingSkills.length} gap items.`,
      date: reportDate,
      format: 'PDF',
    },
    {
      id: `${String(gapReport._id)}-gaps`,
      title: 'Skill Gap Breakdown',
      description: `${gapReport.matchingSkills.length} matching skills, ${gapReport.missingSkills.length} missing skills, and ${analytics.evidenceCoverage || 0}% evidence coverage.`,
      date: reportDate,
      format: 'CSV',
    },
    {
      id: `${String(gapReport._id)}-roadmap`,
      title: 'Roadmap Export',
      description: `${latestRoadmap.title || 'Current roadmap'} at ${analytics.roadmapCompletion || 0}% completion with ${unreadCount} unread notifications.`,
      date: latestRoadmap.updatedAt || reportDate,
      format: 'XLSX',
    },
  ];
}

export const sgipService = {
  async generateGapAnalysis({ studentId, roleId = null } = {}) {
    const resolvedStudentId = resolveStudentId(studentId);
    const context = await loadStudentContext(resolvedStudentId, roleId);
    if (!context.role) {
      throw new AppError('Select a target career role before running gap analysis', 400, errorCodes.VALIDATION_ERROR);
    }
    const profileCompleteness = buildProfileCompleteness(context.profile || {});
    const roadmapProgress = collectRoadmapProgress(context.roadmaps);
    const candidateSkills = buildCandidateSkillPool(context.profile || {}, context.evidence || []);

    const requiredSkills = extractRequiredSkillNames(context.role);
    const preferredSkills = extractPreferredSkillNames(context.role);
    const matchingSkills = buildSkillMatches(requiredSkills, preferredSkills, candidateSkills);
    const missingSkills = buildMissingSkills(requiredSkills, candidateSkills);

    const coreEligibility = calculateCoreEligibility(requiredSkills, candidateSkills);
    const evidenceStrength = calculateEvidenceStrength(context.evidence || []);
    const compatibility = calculateCompatibility(context.profile || {}, context.role || {}, roadmapProgress, candidateSkills);
    const trustAndRecency = calculateTrustAndRecency(context.evidence || []);
    const readinessScore = clamp(
      profileCompleteness * 0.15 +
        coreEligibility * 0.3 +
        evidenceStrength * 0.25 +
        compatibility * 0.2 +
        trustAndRecency * 0.1,
    );
    const confidenceScore = calculateConfidence({
      profileCompleteness,
      evidenceStrength,
      trustAndRecency,
      matchingSkillsCount: matchingSkills.length,
      evidenceCount: (context.evidence || []).length,
    });

    const analysis = {
      studentId,
      roleId: context.role?._id || null,
      roleTitle: context.role?.title || '',
      roleSource: context.role?.source || '',
      roleReviewStatus: context.role?.reviewStatus || '',
      readinessScore,
      confidenceScore,
      profileCompleteness,
      coreEligibility,
      evidenceStrength,
      compatibility,
      trustAndRecency,
      matchingSkills,
      missingSkills,
      recommendations: buildRecommendations({
        profileCompleteness,
        coreEligibility,
        evidenceStrength,
        compatibility,
        trustAndRecency,
        missingSkills,
        roadmapProgress,
      }),
      readinessComponents: [
        { label: 'Profile completeness', value: profileCompleteness, weight: 15 },
        { label: 'Core eligibility', value: coreEligibility, weight: 30 },
        { label: 'Evidence strength', value: evidenceStrength, weight: 25 },
        { label: 'Compatibility', value: compatibility, weight: 20 },
        { label: 'Trust & recency', value: trustAndRecency, weight: 10 },
      ],
      candidateSkillCount: candidateSkills.length,
      evidenceCount: (context.evidence || []).length,
    };

    const assessments = await assessmentRepository.findRecentForStudent(resolvedStudentId, 6);
    const { assessment, gapReport } = await syncAssessmentAndReport(context, analysis, {
      roleReadinessScore: readinessScore,
      evidenceCoverage: missingSkills.length
        ? clamp((matchingSkills.length / (matchingSkills.length + missingSkills.length)) * 100)
        : 0,
      roadmapCompletion: roadmapProgress,
      assessmentImprovement: readinessScore,
      placementConversion: clamp(readinessScore >= 75 ? 100 : readinessScore * 0.8),
    });

    const latestAssessments = [assessment, ...assessments.map(toPlain).filter((item) => String(item._id) !== String(assessment._id))];
    const analytics = await syncPlacementAnalytics(resolvedStudentId, analysis, latestAssessments, context.roadmaps, context.evidence);

    return {
      ...analysis,
      gapReportId: gapReport._id,
      assessmentId: assessment._id,
      roadmapProgress,
      analytics: toPlain(analytics),
    };
  },

  async getDashboard({ studentId, roleId = null } = {}) {
    const resolvedStudentId = resolveStudentId(studentId);
    const [profile, evidence, roadmaps, notifications, gapAnalysis] = await Promise.all([
      studentProfileRepository.findByStudentId(resolvedStudentId),
      skillEvidenceRepository.list({ userId: resolvedStudentId }, { sort: '-createdAt', limit: 100 }),
      roadmapRepository.list({ studentId: resolvedStudentId }, { sort: '-createdAt', limit: 100 }),
      notificationsRepository.list({ studentId: resolvedStudentId }, { sort: '-createdAt', limit: 100 }),
      this.generateGapAnalysis({ studentId: resolvedStudentId, roleId }),
    ]);

    const gapReport = await gapReportRepository.findLatestForStudent(resolvedStudentId, gapAnalysis.roleId);
    const assessment = await assessmentRepository.findLatestForStudent(resolvedStudentId, gapAnalysis.roleId);
    const analytics = await placementAnalyticsRepository.findByStudentId(resolvedStudentId);
    const reportSummaries = buildReportSummaries(
      toPlain(gapReport),
      toPlain(analytics) || {},
      toPlain(roadmaps) || [],
      toPlain(notifications) || [],
      toPlain(assessment),
    );

    return {
      studentId: resolvedStudentId,
      profile: toPlain(profile),
      evidence: toPlain(evidence) || [],
      roadmaps: toPlain(roadmaps) || [],
      notifications: toPlain(notifications) || [],
      gapAnalysis,
      gapReport: toPlain(gapReport),
      assessment: toPlain(assessment),
      analytics: toPlain(analytics),
      reports: reportSummaries,
      stats: {
        readinessScore: gapAnalysis.readinessScore,
        confidenceScore: gapAnalysis.confidenceScore,
        evidenceCoverage: toPlain(analytics)?.evidenceCoverage || 0,
        roadmapCompletion: toPlain(analytics)?.roadmapCompletion || 0,
        unreadNotifications: (toPlain(notifications) || []).filter((item) => !item.read).length,
      },
    };
  },

  async listReports({ studentId, limit = 10 } = {}) {
    const resolvedStudentId = resolveStudentId(studentId);
    const [gapReports, assessments, analytics, roadmaps, notifications] = await Promise.all([
      gapReportRepository.list({ studentId: resolvedStudentId }, { sort: '-createdAt', limit }),
      assessmentRepository.list({ studentId: resolvedStudentId }, { sort: '-createdAt', limit }),
      placementAnalyticsRepository.findByStudentId(resolvedStudentId),
      roadmapRepository.list({ studentId: resolvedStudentId }, { sort: '-createdAt', limit: 100 }),
      notificationsRepository.list({ studentId: resolvedStudentId }, { sort: '-createdAt', limit: 100 }),
    ]);

    const latestGapReport = toPlain(gapReports)[0] || null;
    const latestAssessment = toPlain(assessments)[0] || null;
    const summary = buildReportSummaries(
      latestGapReport,
      toPlain(analytics) || {},
      toPlain(roadmaps) || [],
      toPlain(notifications) || [],
      latestAssessment,
    );

    return {
      gapReports: toPlain(gapReports) || [],
      assessments: toPlain(assessments) || [],
      summary,
    };
  },

  async getAnalytics({ studentId, roleId = null } = {}) {
    const resolvedStudentId = resolveStudentId(studentId);
    let analytics = await placementAnalyticsRepository.findByStudentId(resolvedStudentId);
    if (!analytics) {
      await this.generateGapAnalysis({ studentId: resolvedStudentId, roleId });
      analytics = await placementAnalyticsRepository.findByStudentId(resolvedStudentId);
    }
    const assessments = await assessmentRepository.findRecentForStudent(resolvedStudentId, 6);
    const reports = await gapReportRepository.list({ studentId: resolvedStudentId }, { sort: '-createdAt', limit: 6 });
    const roadmaps = await roadmapRepository.list({ studentId: resolvedStudentId }, { sort: '-createdAt', limit: 100 });
    const notifications = await notificationsRepository.list({ studentId: resolvedStudentId }, { sort: '-createdAt', limit: 100 });
    const latestGapAnalysis = await gapReportRepository.findLatestForStudent(resolvedStudentId, roleId || null);

    return {
      role_readiness_score: toPlain(latestGapAnalysis)?.readinessScore || 0,
      evidence_coverage: toPlain(analytics)?.evidenceCoverage || 0,
      roadmap_completion: toPlain(analytics)?.roadmapCompletion || 0,
      assessment_improvement: toPlain(analytics)?.assessmentImprovement || 0,
      placement_conversion: toPlain(analytics)?.placementConversion || 0,
      readinessTrend: toPlain(analytics)?.readinessTrend || buildReadinessTrend(toPlain(assessments) || [], toPlain(analytics) || {}),
      recentReports: toPlain(reports) || [],
      recentAssessments: toPlain(assessments) || [],
      unreadNotifications: (toPlain(notifications) || []).filter((item) => !item.read).length,
      activeRoadmaps: (toPlain(roadmaps) || []).length,
    };
  },

  async buildReportSummaries({ studentId } = {}) {
    const resolvedStudentId = resolveStudentId(studentId);
    const [gapReports, analytics, roadmaps, notifications, assessments] = await Promise.all([
      gapReportRepository.list({ studentId: resolvedStudentId }, { sort: '-createdAt', limit: 1 }),
      placementAnalyticsRepository.findByStudentId(resolvedStudentId),
      roadmapRepository.list({ studentId: resolvedStudentId }, { sort: '-createdAt', limit: 100 }),
      notificationsRepository.list({ studentId: resolvedStudentId }, { sort: '-createdAt', limit: 100 }),
      assessmentRepository.list({ studentId: resolvedStudentId }, { sort: '-createdAt', limit: 1 }),
    ]);

    const latestGapReport = toPlain(gapReports)[0] || null;
    const latestAssessment = toPlain(assessments)[0] || null;
    return buildReportSummaries(
      latestGapReport,
      toPlain(analytics) || {},
      toPlain(roadmaps) || [],
      toPlain(notifications) || [],
      latestAssessment,
    );
  },
};
