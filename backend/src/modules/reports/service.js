import { AppError, errorCodes } from '../../errors/index.js';
import { User } from '../../models/User.js';
import { StudentProfile } from '../student-profile/model.js';
import { reportsRepository as repo } from './repository.js';

const reportTypes = [
  ['profile-summary', 'Profile Summary', 'Profile completeness, readiness, skills, and evidence overview.'],
  ['resume-analysis', 'Resume Analysis', 'Latest parsed resume, extracted skills, categories, and confidence.'],
  ['gap-analysis', 'Gap Analysis', 'Latest saved readiness analysis and recommendations.'],
  ['roadmap', 'Learning Roadmap', 'Latest roadmap progress, priorities, and next task.'],
  ['skill-evidence', 'Skill Evidence', 'Evidence coverage, trust states, and verified skills.'],
  ['progress', 'Progress', 'Historical readiness, evidence, skills, and roadmap growth.'],
];

function completion(profile) {
  if (!profile) return 0;
  const p = profile.personal || {};
  const e = profile.education || {};
  const values = [p.fullName, p.email, p.phone, p.location, p.bio, p.targetRole, e.institution, e.degree, profile.resume?.url, profile.topSkills?.length];
  return Math.round((values.filter(Boolean).length / values.length) * 100);
}

function countsBy(items, key) {
  return items.reduce((output, item) => {
    const label = item[key] || 'Other';
    output[label] = (output[label] || 0) + 1;
    return output;
  }, {});
}

function latestTask(roadmap) {
  return roadmap?.phases?.flatMap((phase) => phase.tasks || []).find((task) => !['completed', 'skipped'].includes(task.status)) || null;
}

async function sources(studentId) {
  const [profile, resume, skills, evidence, gap, gaps, roadmap, roadmaps] = await Promise.all([
    repo.profile(studentId), repo.latestResume(studentId), repo.skills(studentId), repo.evidence(studentId),
    repo.latestGap(studentId), repo.gapHistory(studentId), repo.latestRoadmap(studentId), repo.roadmapHistory(studentId),
  ]);
  return { profile, resume, skills, evidence, gap, gaps, roadmap, roadmaps };
}

function profileReport(data) {
  const { profile, skills, evidence, gap, roadmap } = data;
  const approved = skills.filter((item) => ['mentor_approved', 'system_verified'].includes(item.reviewState));
  return {
    type: 'profile-summary',
    title: 'Profile Summary Report',
    generatedAt: new Date(),
    studentName: profile?.personal?.fullName || '',
    department: profile?.education?.institution || '',
    targetCareerRole: profile?.personal?.targetRole || gap?.targetRoleSnapshot?.title || '',
    profileCompletion: completion(profile),
    currentReadinessScore: gap?.readinessScore || profile?.overallReadiness || 0,
    totalSkills: skills.length,
    approvedSkills: approved.length,
    studentConfirmedSkills: skills.filter((item) => item.reviewState === 'student_confirmed').length,
    pendingEvidence: evidence.filter((item) => item.reviewState === 'pending_review').length,
    rejectedEvidence: evidence.filter((item) => item.reviewState === 'rejected').length,
    latestGapAnalysisDate: gap?.createdAt || null,
    latestRoadmapProgress: roadmap?.overallProgress || 0,
    resumeUploaded: Boolean(profile?.resume?.url),
    certificatesUploaded: evidence.filter((item) => item.evidenceType === 'certificate').length,
    projectsAdded: evidence.filter((item) => item.evidenceType === 'project').length,
    overallProfileStatus: completion(profile) >= 80 ? 'Placement ready profile' : completion(profile) >= 50 ? 'Developing profile' : 'Profile needs attention',
  };
}

function resumeReport(data) {
  const { resume, skills } = data;
  const resumeSkills = skills.filter((item) => item.createdFrom === 'resume_parser' || item.source === 'resume_parser');
  return {
    type: 'resume-analysis', title: 'Resume Analysis Report', generatedAt: new Date(),
    available: Boolean(resume), uploadDate: resume?.createdAt || null, parsingStatus: resume?.status || 'not_uploaded',
    educationSummary: resume?.extractedEducation || [], experienceSummary: resume?.extractedExperience || [],
    projectsSummary: [], extractedSkills: resume?.extractedSkills || [],
    acceptedSkills: resume?.status === 'reviewed' ? resume.extractedSkills || [] : [],
    rejectedSkills: [], aiConfidence: resume?.aiMetadata?.confidence || 0,
    aiProvider: resume?.aiMetadata?.provider || '', fallbackUsed: Boolean(resume?.aiMetadata?.fallbackUsed),
    resumeDerivedSkills: resumeSkills.map((item) => item.name), skillCategories: countsBy(resume?.extractedSkills || [], 'category'),
  };
}

function gapReport(gap) {
  return {
    type: 'gap-analysis', title: 'Gap Analysis Report', generatedAt: gap?.createdAt || new Date(), available: Boolean(gap),
    reportId: gap?._id ? String(gap._id) : '', targetRole: gap?.targetRoleSnapshot?.title || '',
    overallReadiness: gap?.readinessScore || 0, componentScores: gap?.componentScores || {},
    verifiedMatches: gap?.verifiedMatches || [], studentConfirmedMatches: gap?.studentConfirmedMatches || [],
    partialMatches: gap?.partialMatches || [], missingRequiredSkills: gap?.missingRequiredSkills || [],
    missingPreferredSkills: gap?.missingPreferredSkills || [], weakEvidenceSkills: gap?.weakEvidenceSkills || [],
    recommendations: gap?.recommendations || [], topPrioritySkills: gap?.roadmapInput?.prioritySkills?.slice(0, 3) || [],
  };
}

function roadmapReport(roadmap) {
  const tasks = roadmap?.phases?.flatMap((phase) => phase.tasks || []) || [];
  const currentPhase = roadmap?.phases?.find((phase) => phase.progress < 100) || null;
  const next = latestTask(roadmap);
  return {
    type: 'roadmap', title: 'Learning Roadmap Report', generatedAt: roadmap?.createdAt || new Date(), available: Boolean(roadmap),
    roadmapId: roadmap?._id ? String(roadmap._id) : '', targetRole: roadmap?.targetRoleSnapshot?.title || '',
    estimatedCompletionWeeks: roadmap?.estimatedCompletionWeeks || 0, overallProgress: roadmap?.overallProgress || 0,
    currentPhase, completedTasks: tasks.filter((task) => task.status === 'completed').length,
    remainingTasks: tasks.filter((task) => !['completed', 'skipped'].includes(task.status)).length,
    currentPriority: next?.priority || '', nextRecommendedTask: next || null,
  };
}

function evidenceReport(data) {
  const { skills, evidence, gap } = data;
  const approved = evidence.filter((item) => item.reviewState === 'mentor_approved');
  return {
    type: 'skill-evidence', title: 'Skill Evidence Report', generatedAt: new Date(), totalSkills: skills.length,
    byCategory: countsBy(skills, 'category'), mentorApproved: approved.length,
    studentConfirmed: evidence.filter((item) => item.reviewState === 'student_confirmed').length,
    pendingReview: evidence.filter((item) => item.reviewState === 'pending_review').length,
    rejected: evidence.filter((item) => item.reviewState === 'rejected').length,
    evidenceCoverage: skills.length ? Math.round((skills.filter((item) => item.evidenceSummary?.totalEvidence > 0).length / skills.length) * 1000) / 10 : 0,
    topVerifiedSkills: skills.filter((item) => item.trustLevel === 'high').map((item) => item.name).slice(0, 10),
    weakEvidenceSkills: gap?.weakEvidenceSkills || [],
  };
}

function progressReport(data) {
  const { profile, skills, evidence, gaps, roadmaps } = data;
  const ascendingGaps = [...gaps].reverse();
  const latestRoadmaps = [...roadmaps];
  const completed = latestRoadmaps.flatMap((roadmap) => roadmap.phases || []).flatMap((phase) => phase.tasks || []).filter((task) => task.status === 'completed');
  return {
    type: 'progress', title: 'Progress Report', generatedAt: new Date(),
    profileCompletionTimeline: [{ date: profile?.updatedAt || new Date(), value: completion(profile) }],
    readinessScoreTimeline: ascendingGaps.map((item) => ({ date: item.createdAt, value: item.readinessScore, role: item.targetRoleSnapshot?.title })),
    roadmapProgressTimeline: latestRoadmaps.map((item) => ({ date: item.updatedAt, value: item.overallProgress, role: item.targetRoleSnapshot?.title })),
    evidenceGrowth: evidence.map((item, index) => ({ date: item.createdAt, value: index + 1 })),
    skillsAdded: skills.length, skillsVerified: skills.filter((item) => item.trustLevel === 'high').length,
    gapReduction: ascendingGaps.length > 1 ? Number((ascendingGaps.at(-1).readinessScore - ascendingGaps[0].readinessScore).toFixed(2)) : 0,
    mostImprovedSkillCategories: countsBy(skills.filter((item) => item.trustLevel === 'high'), 'category'),
    recentlyCompletedRoadmapTasks: completed.slice(-10).reverse(),
  };
}

export const reportsService = {
  available: () => reportTypes.map(([type, title, description]) => ({ type, title, description })),
  async get(studentId, type) {
    const data = await sources(studentId);
    if (type === 'profile-summary') return profileReport(data);
    if (type === 'resume-analysis') return resumeReport(data);
    if (type === 'gap-analysis') return gapReport(data.gap);
    if (type === 'roadmap') return roadmapReport(data.roadmap);
    if (type === 'skill-evidence') return evidenceReport(data);
    if (type === 'progress') return progressReport(data);
    throw new AppError('Unknown report type', 404, errorCodes.NOT_FOUND);
  },
  async gapHistory(studentId) {
    return (await repo.gapHistory(studentId)).map(gapReport);
  },
  async gapById(studentId, id) {
    const report = await repo.gapById(studentId, id);
    if (!report) throw new AppError('Gap report not found', 404, errorCodes.NOT_FOUND);
    return gapReport(report);
  },
  async compare(studentId, previousId, currentId) {
    const [previous, current, roadmaps] = await Promise.all([repo.gapById(studentId, previousId), repo.gapById(studentId, currentId), repo.roadmapHistory(studentId)]);
    if (!previous || !current) throw new AppError('Both reports are required', 404, errorCodes.NOT_FOUND);
    const names = (items = []) => new Set(items.map((item) => item.normalizedName || item.skillName));
    const previousMissing = names(previous.missingRequiredSkills);
    const currentMissing = names(current.missingRequiredSkills);
    const previousVerified = names(previous.verifiedMatches);
    const currentVerified = names(current.verifiedMatches);
    return {
      previousReadiness: previous.readinessScore, currentReadiness: current.readinessScore,
      difference: Number((current.readinessScore - previous.readinessScore).toFixed(2)),
      skillsAdded: [...currentVerified].filter((item) => !previousVerified.has(item)),
      skillsVerified: [...currentVerified].filter((item) => !previousVerified.has(item)),
      missingSkillsReduced: [...previousMissing].filter((item) => !currentMissing.has(item)),
      roadmapProgressDifference: roadmaps.length > 1 ? Number((roadmaps.at(-1).overallProgress - roadmaps[0].overallProgress).toFixed(2)) : 0,
    };
  },
  async authorize(requester, requestedStudentId = '') {
    if (requester.role === 'student') return String(requester._id);
    const studentId = String(requestedStudentId || '');
    const student = await User.findOne({ _id: studentId, role: 'student' }).lean();
    if (!student) throw new AppError('Student not found', 404, errorCodes.NOT_FOUND);
    if (requester.role === 'mentor') {
      const assigned = await StudentProfile.exists({ userId: studentId, mentorId: requester._id });
      if (!assigned) throw new AppError('Student is not assigned to this mentor', 403, errorCodes.VALIDATION_ERROR);
    }
    return studentId;
  },
  async snapshotProfile(studentId, profile) {
    return repo.createSnapshot({ studentId, type: 'profile-summary', title: 'Profile Snapshot', sourceId: String(profile._id), snapshot: profile.toObject ? profile.toObject() : profile });
  },
};
