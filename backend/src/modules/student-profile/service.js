import { AppError, errorCodes } from '../../errors/index.js';
import { buildListQuery } from '../../common/query.js';
import { extractResumeSkills } from '../../services/ai/index.js';
import { studentProfileRepository } from './repository.js';

function buildResumeText(payload = {}) {
  const chunks = [];

  const personal = payload.personal || {};
  const education = payload.education || {};

  chunks.push(
    personal.fullName,
    personal.bio,
    personal.targetRole,
    personal.location,
    education.institution,
    education.degree,
    education.cgpa,
    education.semester,
    education.graduationYear,
    payload.resume?.fileName,
  );

  for (const item of payload.experience || []) {
    chunks.push(item.company, item.role, item.duration, ...(item.highlights || []));
  }

  for (const item of payload.certifications || []) {
    chunks.push(item.name, item.issuer, item.year);
  }

  return chunks.filter(Boolean).join('\n');
}

function inferSkillsFromContext(payload = {}) {
  const context = [
    payload.personal?.targetRole,
    payload.personal?.bio,
    payload.education?.degree,
    payload.resume?.fileName,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const skillSets = [
    { keys: ['frontend', 'ui', 'web'], skills: ['React', 'JavaScript', 'HTML', 'CSS'] },
    { keys: ['backend', 'api', 'server'], skills: ['Node.js', 'Express', 'MongoDB', 'SQL'] },
    { keys: ['full stack', 'fullstack'], skills: ['React', 'Node.js', 'JavaScript', 'SQL'] },
    { keys: ['data', 'analytics'], skills: ['SQL', 'Python', 'Data Analysis', 'Statistics'] },
    { keys: ['cloud', 'devops', 'infra'], skills: ['Docker', 'AWS', 'CI/CD', 'Linux'] },
    { keys: ['mobile', 'app'], skills: ['React Native', 'JavaScript', 'APIs', 'Git'] },
  ];

  for (const entry of skillSets) {
    if (entry.keys.some((key) => context.includes(key))) {
      return entry.skills;
    }
  }

  return ['Communication', 'Problem Solving', 'Version Control'];
}

async function enrichWithExtractedSkills(payload, existingProfile = null) {
  const hasExplicitSkills = Array.isArray(payload.topSkills) && payload.topSkills.length > 0;
  if (hasExplicitSkills) {
    return payload;
  }

  const sourcePayload = {
    ...(existingProfile?.toObject ? existingProfile.toObject() : existingProfile || {}),
    ...payload,
    personal: {
      ...(existingProfile?.personal || {}),
      ...(payload.personal || {}),
    },
    education: {
      ...(existingProfile?.education || {}),
      ...(payload.education || {}),
    },
    experience: payload.experience || existingProfile?.experience || [],
    certifications: payload.certifications || existingProfile?.certifications || [],
    resume: {
      ...(existingProfile?.resume || {}),
      ...(payload.resume || {}),
    },
  };

  const resumeText = buildResumeText(sourcePayload);
  if (!resumeText.trim()) {
    return payload;
  }

  try {
    const extracted = await extractResumeSkills({ resumeText });
    const extractedSkills = (extracted?.skills || [])
      .map((skill) => skill?.name)
      .filter(Boolean)
      .slice(0, 10);

    if (!extractedSkills.length) {
      return {
        ...payload,
        topSkills: inferSkillsFromContext(sourcePayload),
        strengths: payload.strengths?.length ? payload.strengths : inferSkillsFromContext(sourcePayload).slice(0, 3),
        improvementAreas: payload.improvementAreas || ['Add stronger project or resume evidence for more precise extraction.'],
      };
    }

    return {
      ...payload,
      topSkills: extractedSkills,
      strengths: payload.strengths?.length ? payload.strengths : extractedSkills.slice(0, 3),
      improvementAreas: payload.improvementAreas || [],
    };
  } catch {
    return payload;
  }
}

function resolveProfileIdentity(payload = {}, existingProfile = null) {
  const studentId = String(
    payload.studentId ||
      payload.userId ||
      existingProfile?.studentId ||
      existingProfile?.userId ||
      '',
  ).trim();
  const userId = String(payload.userId || existingProfile?.userId || studentId).trim();

  if (!studentId) {
    throw new AppError('studentId is required', 400, errorCodes.VALIDATION_ERROR);
  }

  return { studentId, userId };
}

async function withAssignedMentor(profile) {
  if (!profile) return profile;
  const populated = await studentProfileRepository.populateMentor(profile);
  const plain = typeof populated?.toObject === 'function' ? populated.toObject() : { ...populated };
  const mentor = plain.mentorId;

  return {
    ...plain,
    mentorId: mentor?._id ? String(mentor._id) : mentor ? String(mentor) : null,
    assignedMentor: mentor?._id
      ? {
          id: String(mentor._id),
          name: mentor.name,
          email: mentor.email,
          department: mentor.department || '',
          isActive: mentor.isActive !== false,
        }
      : null,
  };
}

async function saveProfileThenEnrich(createFn, payload, existingProfile = null) {
  const { studentId: _ignoredStudentId, userId: _ignoredUserId, ...payloadWithoutIdentity } = payload || {};
  const identity = resolveProfileIdentity(payload, existingProfile);
  const basePayload = {
    ...payloadWithoutIdentity,
    ...identity,
    topSkills: Array.isArray(payload.topSkills) ? payload.topSkills : [],
    strengths: Array.isArray(payload.strengths) ? payload.strengths : [],
    improvementAreas: Array.isArray(payload.improvementAreas) ? payload.improvementAreas : [],
    experience: Array.isArray(payload.experience) ? payload.experience : [],
    certifications: Array.isArray(payload.certifications) ? payload.certifications : [],
    education: payload.education || {},
    resume: payload.resume || {},
  };

  const savedProfile = await createFn(basePayload);

  try {
    const enriched = await enrichWithExtractedSkills(basePayload, existingProfile || savedProfile);
    const hasEnrichment =
      JSON.stringify(enriched.topSkills || []) !== JSON.stringify(basePayload.topSkills || []) ||
      JSON.stringify(enriched.strengths || []) !== JSON.stringify(basePayload.strengths || []) ||
      JSON.stringify(enriched.improvementAreas || []) !== JSON.stringify(basePayload.improvementAreas || []);

    if (hasEnrichment) {
      const refreshed = await studentProfileRepository.updateProfile(savedProfile._id, {
        ...basePayload,
        ...enriched,
      });
      return withAssignedMentor(refreshed || savedProfile);
    }
  } catch {
    // Enrichment is best-effort. The profile data has already been saved.
  }

  return withAssignedMentor(savedProfile);
}

export const studentProfileService = {
  async create(payload) {
    return saveProfileThenEnrich(
      (basePayload) => studentProfileRepository.upsertProfileByStudentId(payload.studentId, basePayload),
      payload,
    );
  },

  async list(query) {
    const { filter, sort } = buildListQuery(
      {
        search: query.search,
        sortBy: query.sortBy || '-createdAt',
        filters: {
          ...(query.studentId ? { studentId: query.studentId } : {}),
          ...(query.targetRole ? { 'personal.targetRole': query.targetRole } : {}),
        },
      },
      ['studentId', 'personal.fullName', 'personal.email', 'personal.targetRole'],
    );

    return {
      items: await studentProfileRepository.list(filter, sort ? { sort } : {}),
      total: await studentProfileRepository.count(filter),
    };
  },

  async getById(id) {
    const profile = await studentProfileRepository.findById(id);
    if (!profile) {
      throw new AppError('Student profile not found', 404, errorCodes.NOT_FOUND);
    }
    return withAssignedMentor(profile);
  },

  async getByStudentId(studentId) {
    const profile = await studentProfileRepository.findByStudentId(studentId);
    if (!profile) {
      throw new AppError('Student profile not found', 404, errorCodes.NOT_FOUND);
    }
    return withAssignedMentor(profile);
  },

  async getOrCreateByStudentId(studentId, seedPayload = {}) {
    const resolvedStudentId = String(studentId || '').trim();
    if (!resolvedStudentId) {
      throw new AppError('studentId is required', 400, errorCodes.VALIDATION_ERROR);
    }

    const profile = await studentProfileRepository.findByStudentId(resolvedStudentId);
    if (profile) {
      const resolvedUserId = String(seedPayload.userId || resolvedStudentId).trim();
      if (resolvedUserId && String(profile.userId || '').trim() !== resolvedUserId) {
        const updated = await studentProfileRepository.updateProfile(profile._id, {
          userId: resolvedUserId,
          studentId: resolvedStudentId,
        });
        return withAssignedMentor(updated);
      }
      return withAssignedMentor(profile);
    }

    const seedIdentity = {
      studentId: resolvedStudentId,
      userId: String(seedPayload.userId || resolvedStudentId).trim(),
    };

    return saveProfileThenEnrich(
      (basePayload) => studentProfileRepository.upsertProfileByStudentId(resolvedStudentId, basePayload),
      {
        ...seedIdentity,
        personal: {
          fullName: seedPayload.personal?.fullName || '',
          email: seedPayload.personal?.email || '',
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
      },
      null,
    );
  },

  async update(id, payload) {
    const existing = await studentProfileRepository.findById(id);
    if (!existing) {
      throw new AppError('Student profile not found', 404, errorCodes.NOT_FOUND);
    }
    return saveProfileThenEnrich((basePayload) => studentProfileRepository.updateProfile(id, basePayload), payload, existing);
  },

  async delete(id) {
    const profile = await studentProfileRepository.deleteProfile(id);
    if (!profile) {
      throw new AppError('Student profile not found', 404, errorCodes.NOT_FOUND);
    }
    return profile;
  },

  async upsertByStudentId(studentId, payload) {
    const profile = await studentProfileRepository.findByStudentId(studentId);
    return saveProfileThenEnrich(
      (basePayload) => studentProfileRepository.upsertProfileByStudentId(studentId, basePayload),
      { studentId, userId: payload?.userId || studentId, ...payload },
      profile,
    );
  },
};
