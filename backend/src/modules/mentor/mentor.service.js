import { AppError, errorCodes } from '../../errors/index.js';
import { verificationStatusForReviewState } from '../../utils/skillTrust.js';
import { recordActivity } from '../admin/activity.service.js';
import { refreshSkillEvidenceSummary } from '../skill/evidenceSummary.js';
import { mentorRepository as repo } from './mentor.repository.js';

function profileCompletion(profile) {
  const personal = profile?.personal || {};
  const education = profile?.education || {};
  const values = [
    personal.fullName, personal.email, personal.phone, personal.location, personal.bio,
    personal.targetRole, education.institution, education.degree, profile?.resume?.url, profile?.topSkills?.length,
  ];
  return Math.round((values.filter(Boolean).length / values.length) * 100);
}

function safeProfile(profile) {
  if (!profile) return null;
  return {
    id: String(profile._id),
    userId: profile.userId,
    personal: {
      fullName: profile.personal?.fullName || '',
      email: profile.personal?.email || '',
      phone: profile.personal?.phone || '',
      location: profile.personal?.location || '',
      github: profile.personal?.github || '',
      linkedin: profile.personal?.linkedin || '',
      bio: profile.personal?.bio || '',
      targetRole: profile.personal?.targetRole || '',
    },
    education: profile.education || {},
    experience: profile.experience || [],
    certifications: profile.certifications || [],
    topSkills: profile.topSkills || [],
    overallReadiness: profile.overallReadiness || 0,
    profileCompletion: profileCompletion(profile),
  };
}

function currentRoadmapPhase(roadmap) {
  return roadmap?.phases?.find((phase) => phase.progress < 100) || roadmap?.phases?.at(-1) || null;
}

function roadmapSummary(roadmap) {
  if (!roadmap) return null;
  const tasks = roadmap.phases?.flatMap((phase) => phase.tasks || []) || [];
  const currentPhase = currentRoadmapPhase(roadmap);
  return {
    id: String(roadmap._id),
    targetRole: roadmap.targetRoleSnapshot?.title || '',
    overallProgress: roadmap.overallProgress || 0,
    status: roadmap.status,
    currentPhase: currentPhase ? { phaseNumber: currentPhase.phaseNumber, title: currentPhase.title, progress: currentPhase.progress } : null,
    pendingTasks: tasks.filter((task) => !['completed', 'skipped'].includes(task.status)).length,
    completedTasks: tasks.filter((task) => task.status === 'completed').length,
    estimatedCompletionWeeks: roadmap.estimatedCompletionWeeks || 0,
    phases: roadmap.phases || [],
    updatedAt: roadmap.updatedAt,
  };
}

function gapSummary(report) {
  if (!report) return null;
  return {
    id: String(report._id),
    targetRole: report.targetRoleSnapshot?.title || '',
    readinessScore: report.readinessScore || 0,
    missingRequiredSkills: report.missingRequiredSkills || [],
    weakEvidenceSkills: report.weakEvidenceSkills || [],
    generatedAt: report.createdAt,
  };
}

async function assignedStudentIds(mentorId) {
  const profiles = await repo.profiles.find({ mentorId }).select('userId').lean();
  return profiles.map((profile) => profile.userId);
}

async function requireAssignedProfile(mentorId, studentId) {
  const profile = await repo.assignedProfile(mentorId, studentId);
  if (!profile) {
    throw new AppError('Student is not assigned to this mentor', 403, errorCodes.VALIDATION_ERROR);
  }
  return profile;
}

function pendingFilter(userIds) {
  return {
    userId: { $in: userIds },
    mentorApprovalRequired: true,
    reviewState: 'pending_review',
    evidenceType: { $nin: ['resume', 'manual'] },
    source: { $ne: 'resume_parser' },
  };
}

async function studentNameMap(userIds) {
  const users = await repo.users.find({ _id: { $in: userIds }, role: 'student' }).select('name email').lean();
  return new Map(users.map((user) => [String(user._id), { id: String(user._id), name: user.name, email: user.email }]));
}

export const mentorService = {
  async dashboard(mentorId) {
    const userIds = await assignedStudentIds(mentorId);
    const [pendingEvidenceCount, statusCounts, recentReviews, profiles, latestGaps] = await Promise.all([
      repo.evidence.countDocuments(pendingFilter(userIds)),
      repo.evidence.aggregate([
        { $match: { userId: { $in: userIds }, mentorApprovalRequired: true } },
        { $group: { _id: '$reviewState', count: { $sum: 1 } } },
      ]),
      repo.evidence.find({
        userId: { $in: userIds },
        'mentorReview.reviewedBy': String(mentorId),
        'mentorReview.reviewedAt': { $ne: null },
      }).sort({ 'mentorReview.reviewedAt': -1 }).limit(6).lean(),
      repo.profiles.find({ mentorId }).select('userId personal overallReadiness').lean(),
      repo.gaps.aggregate([
        { $match: { userId: { $in: userIds }, status: 'generated' } },
        { $sort: { createdAt: -1 } },
        { $group: { _id: '$userId', readinessScore: { $first: '$readinessScore' } } },
      ]),
    ]);
    const status = new Map(statusCounts.map((item) => [item._id, item.count]));
    const readiness = new Map(latestGaps.map((item) => [item._id, item.readinessScore]));
    const names = await studentNameMap(userIds);
    return {
      assignedStudentsCount: userIds.length,
      pendingEvidenceCount,
      approvedEvidenceCount: status.get('mentor_approved') || 0,
      rejectedEvidenceCount: status.get('rejected') || 0,
      changesRequestedCount: status.get('changes_requested') || 0,
      recentReviews: recentReviews.map((item) => ({ ...item, student: names.get(item.userId) || null })),
      studentsNeedingAttention: profiles
        .map((profile) => ({
          id: profile.userId,
          name: profile.personal?.fullName || names.get(profile.userId)?.name || 'Student',
          targetRole: profile.personal?.targetRole || '',
          readinessScore: readiness.get(profile.userId) || profile.overallReadiness || 0,
        }))
        .filter((student) => student.readinessScore < 50)
        .sort((left, right) => left.readinessScore - right.readinessScore)
        .slice(0, 8),
    };
  },

  async listStudents(mentorId, { skip = 0, limit = 20 } = {}) {
    const [profiles, total] = await Promise.all([
      repo.profiles.find({ mentorId }).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
      repo.profiles.countDocuments({ mentorId }),
    ]);
    const userIds = profiles.map((profile) => profile.userId);
    const [users, skillCounts, evidenceCounts, gaps, roadmaps] = await Promise.all([
      repo.users.find({ _id: { $in: userIds }, role: 'student' }).select('name email isActive').lean(),
      repo.skills.aggregate([{ $match: { userId: { $in: userIds } } }, { $group: { _id: '$userId', total: { $sum: 1 }, approved: { $sum: { $cond: [{ $eq: ['$trustLevel', 'high'] }, 1, 0] } } } }]),
      repo.evidence.aggregate([{ $match: pendingFilter(userIds) }, { $group: { _id: '$userId', pending: { $sum: 1 } } }]),
      repo.gaps.aggregate([{ $match: { userId: { $in: userIds }, status: 'generated' } }, { $sort: { createdAt: -1 } }, { $group: { _id: '$userId', readiness: { $first: '$readinessScore' } } }]),
      repo.roadmaps.aggregate([{ $match: { userId: { $in: userIds }, status: { $ne: 'archived' } } }, { $sort: { createdAt: -1 } }, { $group: { _id: '$userId', progress: { $first: '$overallProgress' } } }]),
    ]);
    const maps = {
      users: new Map(users.map((item) => [String(item._id), item])),
      skills: new Map(skillCounts.map((item) => [item._id, item])),
      evidence: new Map(evidenceCounts.map((item) => [item._id, item.pending])),
      gaps: new Map(gaps.map((item) => [item._id, item.readiness])),
      roadmaps: new Map(roadmaps.map((item) => [item._id, item.progress])),
    };
    return {
      items: profiles.map((profile) => {
        const user = maps.users.get(profile.userId);
        const skills = maps.skills.get(profile.userId) || { total: 0, approved: 0 };
        return {
          id: profile.userId,
          name: user?.name || profile.personal?.fullName || 'Student',
          email: user?.email || profile.personal?.email || '',
          isActive: user?.isActive !== false,
          profileCompletion: profileCompletion(profile),
          totalSkills: skills.total,
          approvedSkills: skills.approved,
          pendingEvidenceCount: maps.evidence.get(profile.userId) || 0,
          latestReadinessScore: maps.gaps.get(profile.userId) || profile.overallReadiness || 0,
          latestRoadmapProgress: maps.roadmaps.get(profile.userId) || 0,
        };
      }),
      total,
    };
  },

  async getStudent(mentorId, studentId) {
    const profile = await requireAssignedProfile(mentorId, studentId);
    const [user, skills, evidence, gap, roadmap] = await Promise.all([
      repo.users.findOne({ _id: studentId, role: 'student' }).select('name email isActive createdAt').lean(),
      repo.skills.find({ userId: String(studentId) }).select('name category level reviewState trustLevel evidenceSummary').sort({ name: 1 }).lean(),
      repo.evidence.find({ userId: String(studentId) }).select('-filePublicId').sort({ createdAt: -1 }).lean(),
      repo.latestGap(studentId),
      repo.latestRoadmap(studentId),
    ]);
    const evidenceSummary = evidence.reduce((summary, item) => {
      summary.total += 1;
      summary[item.reviewState] = (summary[item.reviewState] || 0) + 1;
      return summary;
    }, { total: 0 });
    return {
      student: user,
      profile: safeProfile(profile),
      skillsSummary: { total: skills.length, approved: skills.filter((skill) => skill.trustLevel === 'high').length, items: skills },
      evidenceSummary: { ...evidenceSummary, items: evidence },
      latestGapReport: gapSummary(gap),
      latestRoadmap: roadmapSummary(roadmap),
    };
  },

  async pendingEvidence(mentorId, { skip = 0, limit = 20 } = {}) {
    const userIds = await assignedStudentIds(mentorId);
    const filter = pendingFilter(userIds);
    const [items, total, names] = await Promise.all([
      repo.evidence.find(filter).select('-filePublicId').sort({ submittedAt: -1 }).skip(skip).limit(limit).lean(),
      repo.evidence.countDocuments(filter),
      studentNameMap(userIds),
    ]);
    return { items: items.map((item) => ({ ...item, student: names.get(item.userId) || null })), total };
  },

  async reviewEvidence(mentor, evidenceId, { decision, comment }) {
    const evidence = await repo.evidence.findById(evidenceId);
    if (!evidence) throw new AppError('Skill evidence not found', 404, errorCodes.NOT_FOUND);
    if (String(evidence.userId) === String(mentor._id)) {
      throw new AppError('Mentors cannot review their own evidence', 403, errorCodes.VALIDATION_ERROR);
    }
    await requireAssignedProfile(mentor._id, evidence.userId);
    if (!evidence.mentorApprovalRequired || ['resume', 'manual'].includes(evidence.evidenceType) || evidence.source === 'resume_parser') {
      throw new AppError('This evidence does not require mentor review', 400, errorCodes.VALIDATION_ERROR);
    }
    const updated = await repo.evidence.findByIdAndUpdate(evidenceId, {
      reviewState: decision,
      verificationStatus: verificationStatusForReviewState(decision),
      trustLevel: decision === 'mentor_approved' ? 'high' : 'low',
      mentorReview: {
        reviewedBy: String(mentor._id),
        reviewedAt: new Date(),
        decision,
        comment: comment || '',
      },
    }, { new: true, runValidators: true });
    await refreshSkillEvidenceSummary(evidence.skillId);
    await recordActivity({
      actorId: mentor._id,
      actorRole: 'mentor',
      action: 'mentor_reviewed_evidence',
      targetType: 'SkillEvidence',
      targetId: String(evidence._id),
      message: `${mentor.name} ${decision.replaceAll('_', ' ')} evidence for ${evidence.skillLabel}`,
      metadata: { decision, studentId: evidence.userId },
    });
    return updated;
  },

  async reviewHistory(mentorId, { skip = 0, limit = 20, decision = '', studentId = '', dateFrom = '', dateTo = '' } = {}) {
    const userIds = await assignedStudentIds(mentorId);
    const filter = { userId: { $in: userIds }, 'mentorReview.reviewedBy': String(mentorId), 'mentorReview.reviewedAt': { $ne: null } };
    if (decision) filter['mentorReview.decision'] = decision;
    if (studentId) {
      await requireAssignedProfile(mentorId, studentId);
      filter.userId = String(studentId);
    }
    if (dateFrom || dateTo) {
      filter['mentorReview.reviewedAt'] = {};
      if (dateFrom) filter['mentorReview.reviewedAt'].$gte = new Date(dateFrom);
      if (dateTo) filter['mentorReview.reviewedAt'].$lte = new Date(dateTo);
    }
    const [items, total, names] = await Promise.all([
      repo.evidence.find(filter).select('-filePublicId').sort({ 'mentorReview.reviewedAt': -1 }).skip(skip).limit(limit).lean(),
      repo.evidence.countDocuments(filter),
      studentNameMap(userIds),
    ]);
    return { items: items.map((item) => ({ ...item, student: names.get(item.userId) || null })), total };
  },

  async latestGapReportsByRole(mentorId, studentId) {
    await requireAssignedProfile(mentorId, studentId);
    const reports = await repo.gaps
      .find({ userId: String(studentId), status: 'generated' })
      .sort({ createdAt: -1 })
      .lean();
    const latestByRole = new Map();

    for (const report of reports) {
      const roleKey = report.careerRoleId
        ? String(report.careerRoleId)
        : String(report.targetRoleSnapshot?.title || '').trim().toLowerCase();
      if (roleKey && !latestByRole.has(roleKey)) {
        latestByRole.set(roleKey, gapSummary(report));
      }
    }

    return [...latestByRole.values()];
  },

  async gapReport(mentorId, studentId, reportId) {
    await requireAssignedProfile(mentorId, studentId);
    const requested = await repo.gaps.findOne({
      _id: reportId,
      userId: String(studentId),
      status: 'generated',
    }).lean();
    if (!requested) throw new AppError('Gap report not found', 404, errorCodes.NOT_FOUND);

    const roleFilter = requested.careerRoleId
      ? { careerRoleId: requested.careerRoleId }
      : { 'targetRoleSnapshot.title': requested.targetRoleSnapshot?.title || '' };
    const latestForRole = await repo.gaps
      .findOne({ userId: String(studentId), status: 'generated', ...roleFilter })
      .sort({ createdAt: -1 })
      .lean();

    if (!latestForRole || String(latestForRole._id) !== String(requested._id)) {
      throw new AppError('Only the latest gap report for each career role is available to mentors', 404, errorCodes.NOT_FOUND);
    }
    return requested;
  },

  async roadmap(mentorId, studentId) {
    await requireAssignedProfile(mentorId, studentId);
    return roadmapSummary(await repo.latestRoadmap(studentId));
  },
};
