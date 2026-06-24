import bcrypt from 'bcryptjs';
import { AppError, errorCodes } from '../../errors/index.js';
import { skillTaxonomy } from '../../utils/skillTaxonomy.js';
import { normalizeRolePayload } from '../career-role/utils.js';
import { adminRepository as repo } from './admin.repository.js';

function escapeRegex(value = '') {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function safeUser(user, extra = {}) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department || '',
    isActive: user.isActive !== false,
    mustChangePassword: Boolean(user.mustChangePassword),
    createdByAdmin: Boolean(user.createdByAdmin),
    createdAt: user.createdAt,
    ...extra,
  };
}

function profileCompletion(profile) {
  if (!profile) return 0;
  const personal = profile.personal || {};
  const education = profile.education || {};
  const checks = [
    personal.fullName,
    personal.email,
    personal.phone,
    personal.location,
    personal.bio,
    personal.targetRole,
    education.institution,
    education.degree,
    profile.resume?.url,
    profile.topSkills?.length,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

async function writeActivity(actor, action, targetType, targetId, message, metadata = {}) {
  return repo.logActivity({
    actorId: actor?.userId || null,
    actorRole: actor?.user?.role || 'system',
    action,
    targetType,
    targetId: String(targetId || ''),
    message,
    metadata,
  });
}

function roleOutput(role) {
  const plain = typeof role?.toObject === 'function' ? role.toObject() : role;
  if (!plain) return null;
  return {
    id: String(plain._id),
    title: plain.title,
    aliases: plain.aliases || [],
    category: plain.category,
    description: plain.description,
    experienceLevel: plain.experienceLevel,
    requiredSkills: plain.requiredSkills || [],
    preferredSkills: plain.preferredSkills || [],
    roadmapHints: plain.roadmapHints || [],
    source: plain.source,
    reviewStatus: plain.reviewStatus,
    isActive: plain.isActive !== false,
    reviewedAt: plain.reviewedAt,
    reviewComment: plain.reviewComment || '',
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
}

export const adminService = {
  async dashboard() {
    const [
      totalStudents,
      totalMentors,
      activeUsers,
      pendingEvidenceReviews,
      approvedEvidenceCount,
      pendingAiRoles,
      totalCareerRoles,
      readiness,
      recentActivity,
    ] = await Promise.all([
      repo.users.countDocuments({ role: 'student' }),
      repo.users.countDocuments({ role: 'mentor' }),
      repo.users.countDocuments({ isActive: { $ne: false } }),
      repo.evidence.countDocuments({ verificationStatus: 'pending' }),
      repo.evidence.countDocuments({ verificationStatus: 'approved' }),
      repo.roles.countDocuments({ source: 'ai_generated', reviewStatus: 'pending', isActive: { $ne: false } }),
      repo.roles.countDocuments({ isActive: { $ne: false } }),
      repo.gaps.aggregate([
        { $match: { status: 'generated' } },
        { $sort: { createdAt: 1 } },
        { $group: { _id: '$userId', score: { $last: '$readinessScore' } } },
        { $group: { _id: null, average: { $avg: '$score' } } },
      ]),
      repo.activity.find({}).sort({ createdAt: -1 }).limit(8).lean(),
    ]);

    return {
      totalStudents,
      totalMentors,
      activeUsers,
      pendingEvidenceReviews,
      approvedEvidenceCount,
      pendingAiRoles,
      totalCareerRoles,
      averageReadinessScore: Math.round((readiness[0]?.average || 0) * 10) / 10,
      recentActivity,
    };
  },

  async createMentor(payload, actor) {
    const email = payload.email.toLowerCase();
    if (await repo.users.exists({ email })) {
      throw new AppError('An account with this email already exists', 409, errorCodes.CONFLICT);
    }
    const mentor = await repo.users.create({
      name: payload.name,
      email,
      password: await bcrypt.hash(payload.temporaryPassword, 12),
      role: 'mentor',
      department: payload.department,
      isEmailVerified: true,
      isActive: true,
      createdByAdmin: true,
      mustChangePassword: true,
    });
    await writeActivity(actor, 'admin_created_mentor', 'User', mentor._id, `Created mentor ${mentor.name}`);
    return safeUser(mentor, { assignedStudentsCount: 0 });
  },

  async listMentors({ skip = 0, limit = 50 } = {}) {
    const [items, total] = await Promise.all([
      repo.users.find({ role: 'mentor' }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      repo.users.countDocuments({ role: 'mentor' }),
    ]);
    const counts = await repo.profiles.aggregate([
      { $match: { mentorId: { $in: items.map((item) => item._id) } } },
      { $group: { _id: '$mentorId', count: { $sum: 1 } } },
    ]);
    const countMap = new Map(counts.map((item) => [String(item._id), item.count]));
    return {
      items: items.map((mentor) => safeUser(mentor, { assignedStudentsCount: countMap.get(String(mentor._id)) || 0 })),
      total,
    };
  },

  async updateMentor(id, payload, actor) {
    const mentor = await repo.users.findOneAndUpdate({ _id: id, role: 'mentor' }, payload, { new: true, runValidators: true });
    if (!mentor) throw new AppError('Mentor not found', 404, errorCodes.NOT_FOUND);
    await writeActivity(actor, 'admin_updated_mentor', 'User', mentor._id, `Updated mentor ${mentor.name}`);
    return safeUser(mentor);
  },

  async updateUserStatus(id, role, isActive, actor) {
    const user = await repo.users.findOneAndUpdate({ _id: id, role }, { isActive }, { new: true, runValidators: true });
    if (!user) throw new AppError(`${role === 'mentor' ? 'Mentor' : 'Student'} not found`, 404, errorCodes.NOT_FOUND);
    await writeActivity(
      actor,
      isActive ? 'admin_activated_user' : 'admin_deactivated_user',
      'User',
      user._id,
      `${isActive ? 'Activated' : 'Deactivated'} ${role} ${user.name}`,
    );
    return safeUser(user);
  },

  async listStudents({ skip = 0, limit = 20, search = '', department = '', mentorId = '' } = {}) {
    const userFilter = { role: 'student' };
    if (search) {
      const expression = new RegExp(escapeRegex(search), 'i');
      userFilter.$or = [{ name: expression }, { email: expression }];
    }
    if (department) userFilter.department = department;

    const profileFilter = mentorId ? { mentorId } : {};
    const allowedProfiles = mentorId ? await repo.profiles.find(profileFilter).select('userId').lean() : null;
    if (allowedProfiles) userFilter._id = { $in: allowedProfiles.map((item) => item.userId) };

    const [users, total] = await Promise.all([
      repo.users.find(userFilter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      repo.users.countDocuments(userFilter),
    ]);
    const ids = users.map((user) => String(user._id));
    const [profiles, evidenceCounts, latestGaps] = await Promise.all([
      repo.profiles.find({ userId: { $in: ids } }).populate('mentorId', 'name email').lean(),
      repo.evidence.aggregate([
        { $match: { userId: { $in: ids } } },
        { $group: { _id: '$userId', total: { $sum: 1 }, approved: { $sum: { $cond: [{ $eq: ['$verificationStatus', 'approved'] }, 1, 0] } }, pending: { $sum: { $cond: [{ $eq: ['$verificationStatus', 'pending'] }, 1, 0] } } } },
      ]),
      repo.gaps.aggregate([
        { $match: { userId: { $in: ids }, status: 'generated' } },
        { $sort: { createdAt: -1 } },
        { $group: { _id: '$userId', readinessScore: { $first: '$readinessScore' } } },
      ]),
    ]);
    const profileMap = new Map(profiles.map((item) => [item.userId, item]));
    const evidenceMap = new Map(evidenceCounts.map((item) => [item._id, item]));
    const gapMap = new Map(latestGaps.map((item) => [item._id, item.readinessScore]));

    return {
      items: users.map((user) => {
        const profile = profileMap.get(String(user._id));
        const evidence = evidenceMap.get(String(user._id)) || { total: 0, approved: 0, pending: 0 };
        return safeUser(user, {
          profileCompletion: profileCompletion(profile),
          assignedMentor: profile?.mentorId ? { id: String(profile.mentorId._id), name: profile.mentorId.name, email: profile.mentorId.email } : null,
          latestReadinessScore: gapMap.get(String(user._id)) || 0,
          evidenceCounts: { total: evidence.total, approved: evidence.approved, pending: evidence.pending },
        });
      }),
      total,
    };
  },

  async getStudent(studentId) {
    const student = await repo.users.findOne({ _id: studentId, role: 'student' }).lean();
    if (!student) throw new AppError('Student not found', 404, errorCodes.NOT_FOUND);
    const userId = String(student._id);
    const [profile, skills, evidence, latestGapReport, roadmap] = await Promise.all([
      repo.profiles.findOne({ userId }).populate('mentorId', 'name email department').lean(),
      repo.skills.find({ userId }).select('name category level trustLevel reviewState').lean(),
      repo.evidence.find({ userId }).select('skillLabel evidenceType verificationStatus trustLevel submittedAt').lean(),
      repo.latestGapFor(userId),
      repo.activeRoadmapFor(userId),
    ]);
    const evidenceSummary = evidence.reduce((summary, item) => {
      summary.total += 1;
      summary[item.verificationStatus] = (summary[item.verificationStatus] || 0) + 1;
      return summary;
    }, { total: 0 });
    return {
      student: safeUser(student),
      profile,
      assignedMentor: profile?.mentorId || null,
      skillsSummary: { total: skills.length, items: skills },
      evidenceSummary: { ...evidenceSummary, items: evidence },
      latestGapReport,
      roadmapProgress: roadmap ? { id: String(roadmap._id), overallProgress: roadmap.overallProgress, status: roadmap.status, targetRole: roadmap.targetRoleSnapshot?.title } : null,
    };
  },

  async assignMentor(studentId, mentorId, actor) {
    const [student, mentor] = await Promise.all([
      repo.users.findOne({ _id: studentId, role: 'student' }),
      repo.users.findOne({ _id: mentorId, role: 'mentor', isActive: { $ne: false } }),
    ]);
    if (!student) throw new AppError('Student not found', 404, errorCodes.NOT_FOUND);
    if (!mentor) throw new AppError('Active mentor not found', 404, errorCodes.NOT_FOUND);
    const profile = await repo.profiles.findOneAndUpdate(
      { userId: String(student._id) },
      { mentorId: mentor._id },
      { new: true, runValidators: true },
    );
    if (!profile) throw new AppError('Student profile not found', 404, errorCodes.NOT_FOUND);
    await writeActivity(actor, 'admin_assigned_mentor', 'StudentProfile', profile._id, `Assigned ${student.name} to ${mentor.name}`, {
      studentId: String(student._id),
      mentorId: String(mentor._id),
    });
    return { student: safeUser(student), mentor: safeUser(mentor) };
  },

  async listCareerRoles({ skip = 0, limit = 20, search = '', source = '', reviewStatus = '', category = '' } = {}) {
    const filter = {};
    if (search) filter.$or = [{ title: new RegExp(escapeRegex(search), 'i') }, { aliases: new RegExp(escapeRegex(search), 'i') }];
    if (source) filter.source = source;
    if (reviewStatus) filter.reviewStatus = reviewStatus;
    if (category) filter.category = category;
    const [items, total] = await Promise.all([
      repo.roles.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      repo.roles.countDocuments(filter),
    ]);
    return { items: items.map(roleOutput), total };
  },

  async createCareerRole(payload, actor) {
    const normalized = normalizeRolePayload({ ...payload, source: 'manual', reviewStatus: payload.reviewStatus || 'approved' });
    if (await repo.roles.exists({ normalizedTitle: normalized.normalizedTitle })) {
      throw new AppError('Career role already exists', 409, errorCodes.CONFLICT);
    }
    const role = await repo.roles.create({ ...normalized, isActive: true });
    await writeActivity(actor, 'admin_created_career_role', 'CareerRole', role._id, `Created career role ${role.title}`);
    return roleOutput(role);
  },

  async updateCareerRole(id, payload, actor) {
    const current = await repo.roles.findById(id);
    if (!current) throw new AppError('Career role not found', 404, errorCodes.NOT_FOUND);
    const normalized = normalizeRolePayload({ ...current.toObject(), ...payload });
    const role = await repo.roles.findByIdAndUpdate(id, { ...normalized, isActive: payload.isActive ?? current.isActive }, { new: true, runValidators: true });
    await writeActivity(actor, 'admin_updated_career_role', 'CareerRole', role._id, `Updated career role ${role.title}`);
    return roleOutput(role);
  },

  async archiveCareerRole(id, actor) {
    const role = await repo.roles.findByIdAndUpdate(id, { isActive: false, reviewStatus: 'archived' }, { new: true });
    if (!role) throw new AppError('Career role not found', 404, errorCodes.NOT_FOUND);
    await writeActivity(actor, 'admin_archived_career_role', 'CareerRole', role._id, `Archived career role ${role.title}`);
    return roleOutput(role);
  },

  async reviewCareerRole(id, { decision, comment }, actor) {
    const role = await repo.roles.findOneAndUpdate(
      { _id: id, source: 'ai_generated' },
      {
        reviewStatus: decision,
        isActive: decision === 'approved',
        reviewedBy: actor.userId,
        reviewedAt: new Date(),
        reviewComment: comment || '',
      },
      { new: true, runValidators: true },
    );
    if (!role) throw new AppError('AI-generated career role not found', 404, errorCodes.NOT_FOUND);
    await writeActivity(actor, 'admin_reviewed_ai_role', 'CareerRole', role._id, `${decision === 'approved' ? 'Approved' : 'Rejected'} AI role ${role.title}`, { decision, comment });
    return roleOutput(role);
  },

  skillTaxonomy() {
    const categories = [...new Set(skillTaxonomy.map((skill) => skill.category))].sort();
    return { categories, skills: skillTaxonomy };
  },

  async analytics() {
    const [gapStats, evidenceStats, roadmapStats, selectedRoles, missingSkills, weakSkills, aiRoles, pendingReviews] = await Promise.all([
      repo.gaps.aggregate([{ $match: { status: 'generated' } }, { $group: { _id: null, average: { $avg: '$readinessScore' } } }]),
      repo.evidence.aggregate([{ $group: { _id: null, total: { $sum: 1 }, approved: { $sum: { $cond: [{ $eq: ['$verificationStatus', 'approved'] }, 1, 0] } } } }]),
      repo.roadmaps.aggregate([{ $match: { status: { $in: ['active', 'completed'] } } }, { $group: { _id: null, average: { $avg: '$overallProgress' } } }]),
      repo.profiles.aggregate([{ $match: { 'personal.targetRole': { $ne: '' } } }, { $group: { _id: '$personal.targetRole', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 8 }]),
      repo.gaps.aggregate([{ $unwind: '$missingRequiredSkills' }, { $group: { _id: '$missingRequiredSkills.skillName', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 8 }]),
      repo.gaps.aggregate([{ $unwind: '$weakEvidenceSkills' }, { $group: { _id: '$weakEvidenceSkills.skillName', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 8 }]),
      repo.roles.countDocuments({ source: 'ai_generated' }),
      repo.evidence.countDocuments({ verificationStatus: 'pending' }),
    ]);
    const evidence = evidenceStats[0] || { total: 0, approved: 0 };
    return {
      roleReadinessScoreAverage: Math.round((gapStats[0]?.average || 0) * 10) / 10,
      evidenceCoverage: evidence.total ? Math.round((evidence.approved / evidence.total) * 1000) / 10 : 0,
      roadmapCompletion: Math.round((roadmapStats[0]?.average || 0) * 10) / 10,
      assessmentImprovement: 0,
      placementConversion: 0,
      mostSelectedCareerRoles: selectedRoles.map((item) => ({ label: item._id, count: item.count })),
      mostMissingSkills: missingSkills.map((item) => ({ label: item._id, count: item.count })),
      mostCommonWeakEvidenceSkills: weakSkills.map((item) => ({ label: item._id, count: item.count })),
      aiGeneratedRoles: aiRoles,
      pendingMentorReviews: pendingReviews,
    };
  },

  async activity({ skip = 0, limit = 20, action = '', actorRole = '', dateFrom = '', dateTo = '' } = {}) {
    const filter = {};
    if (action) filter.action = action;
    if (actorRole) filter.actorRole = actorRole;
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }
    const [items, total] = await Promise.all([
      repo.activity.find(filter).populate('actorId', 'name email').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      repo.activity.countDocuments(filter),
    ]);
    return { items, total };
  },
};
