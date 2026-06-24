import { Readable } from 'stream';
import { AppError, errorCodes } from '../../errors/index.js';
import { buildListQuery } from '../../common/query.js';
import { cloudinary } from '../../config/cloudinary.js';
import { normalizeSkill, normalizeSkillDetails, titleCaseSkill } from '../../utils/normalizeSkill.js';
import { validateEvidenceFile } from '../../utils/fileValidation.js';
import { skillRepository } from '../skill/repository.js';
import { skillEvidenceRepository } from './repository.js';
import { studentProfileRepository } from '../student-profile/repository.js';
import { normalizeSkillLevel, skillLevelLabel } from '../../utils/skillLevel.js';
import { evidenceDefaults, verificationStatusForReviewState } from '../../utils/skillTrust.js';
import { enrichEvidence, refreshSkillEvidenceSummary, summarizeSkill } from '../skill/evidenceSummary.js';
import { recordActivity } from '../admin/activity.service.js';

function toPlain(doc) {
  if (!doc) return null;
  return typeof doc.toObject === 'function' ? doc.toObject() : doc;
}

function ensureMentor(reqUser) {
  if (reqUser?.role !== 'mentor') {
    throw new AppError('Mentor access required', 403, errorCodes.VALIDATION_ERROR);
  }
}

function defaultConfidenceByEvidenceType(evidenceType = 'manual') {
  const defaults = {
    resume: 0.65,
    certificate: 0.82,
    project: 0.76,
    internship: 0.8,
    assessment: 0.74,
    coding_platform: 0.7,
    research: 0.78,
    competition: 0.77,
    manual: 0.45,
  };

  return defaults[evidenceType] ?? 0.5;
}

function statusWeight(status = '') {
  const weights = {
    approved: 5,
    self_declared: 4,
    pending: 3,
    changes_requested: 3,
    draft: 2,
    rejected: 1,
  };

  return weights[status] || 0;
}

function bestVerificationStatus(items = []) {
  return summarizeSkill({}, items).evidenceSummary.bestEvidenceStatus;
}

function uniqueSkillLabels(skills = []) {
  const seen = new Set();
  const labels = [];

  for (const skill of skills) {
    const details = normalizeSkillDetails(skill?.canonicalName || skill?.name || '');
    const label = details.canonicalName;
    const normalizedName = details.normalizedName;
    if (!label || !normalizedName || seen.has(normalizedName)) continue;
    seen.add(normalizedName);
    labels.push(label);
  }

  return labels;
}

async function uploadEvidenceFile(file) {
  if (!file) return { fileUrl: '', filePublicId: '' };
  validateEvidenceFile(file);

  return new Promise((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      {
        folder: 'sgip/skill-evidence',
        resource_type: 'auto',
        use_filename: true,
        unique_filename: true,
      },
      (error, result) => {
        if (error) return reject(error);
        return resolve({
          fileUrl: result?.secure_url || '',
          filePublicId: result?.public_id || '',
        });
      },
    );

    Readable.from(file.buffer).pipe(upload);
  });
}

async function findOrCreateSkill({ userId, skillName, category, level, source = 'manual', createdFrom = 'manual' }) {
  const details = normalizeSkillDetails(skillName);
  const label = details.canonicalName;
  const normalizedName = details.normalizedName;
  if (!normalizedName) {
    throw new AppError('A valid skill name is required', 400, errorCodes.VALIDATION_ERROR);
  }

  const existing = await skillRepository.findByUserAndNormalizedName(userId, normalizedName);
  if (existing) {
    return skillRepository.updateById(existing._id, {
      level: normalizeSkillLevel(level, 2),
      category: !category || category === 'Other' ? existing.category || details.category : category,
    });
  }

  return skillRepository.create({
    userId,
    name: label,
    originalName: skillName,
    canonicalName: details.canonicalName,
    normalizedName,
    category: !category || category === 'Other' ? details.category : category,
    parentConcepts: details.parentConcepts,
    relatedTo: details.relatedSkills,
    level: normalizeSkillLevel(level, 2),
    source,
    sourceDetails: { createdFrom },
    reviewState: source === 'system' ? 'system_verified' : 'student_confirmed',
    trustLevel: source === 'system' ? 'high' : 'medium',
    mentorApprovalRequired: false,
    createdFrom,
  });
}

function buildSkillNames(payload = {}) {
  const names = [payload.skillName, ...(payload.relatedSkills || [])]
    .flatMap((item) => String(item || '').split(/[,/|;]/g))
    .map((item) => item.trim())
    .filter(Boolean);

  const byNormalized = new Map();
  for (const name of names) {
    const details = normalizeSkillDetails(name);
    const label = details.canonicalName;
    const normalized = details.normalizedName;
    if (!normalized || byNormalized.has(normalized)) continue;
    byNormalized.set(normalized, label);
  }

  return [...byNormalized.values()];
}

function buildEvidencePayload({ userId, skill, payload, upload, reqUserId }) {
  const defaults = evidenceDefaults({
    evidenceType: payload.evidenceType,
    source: payload.source,
  });
  return {
    userId,
    skillId: skill._id,
    skillLabel: skill.name,
    evidenceType: payload.evidenceType,
    title: payload.title,
    description: payload.description || '',
    fileUrl: upload.fileUrl || '',
    filePublicId: upload.filePublicId || '',
    externalLink: payload.externalLink || '',
    issuingOrganization: payload.issuingOrganization || '',
    issueDate: payload.issueDate || null,
    expiryDate: payload.expiryDate || null,
    projectName: payload.projectName || '',
    projectRole: payload.projectRole || '',
    projectUrl: payload.projectUrl || '',
    internshipCompany: payload.internshipCompany || '',
    internshipRole: payload.internshipRole || '',
    internshipDuration: payload.internshipDuration || '',
    assessmentName: payload.assessmentName || '',
    assessmentScore: payload.assessmentScore ?? null,
    confidence: payload.confidence ?? defaultConfidenceByEvidenceType(payload.evidenceType),
    verificationStatus: verificationStatusForReviewState(defaults.reviewState),
    reviewState: defaults.reviewState,
    trustLevel: defaults.trustLevel,
    submittedAt: new Date(),
    source: defaults.source,
    mentorApprovalRequired: defaults.mentorApprovalRequired,
    mentorReview: {
      reviewedBy: '',
      reviewedAt: null,
      decision: null,
      comment: '',
    },
    createdBy: reqUserId,
  };
}

async function syncProfileSkills(userId) {
  const [profile, skills] = await Promise.all([
    studentProfileRepository.findByUserId(userId),
    skillRepository.listByUserId(userId, { sort: 'name', limit: 500 }),
  ]);

  if (!profile) return;

  await studentProfileRepository.updateProfile(profile._id, {
    topSkills: uniqueSkillLabels(skills),
  });
}

function buildEvidenceFilter(query, userId = '') {
  return buildListQuery(
    {
      search: query.search,
      sortBy: query.sortBy || '-createdAt',
      filters: {
        ...(userId ? { userId } : {}),
        ...(query.category ? { category: query.category } : {}),
        ...(query.status ? { verificationStatus: query.status } : {}),
        ...(query.evidenceType ? { evidenceType: query.evidenceType } : {}),
      },
    },
    ['skillLabel', 'title', 'description', 'issuingOrganization', 'projectName', 'internshipCompany', 'assessmentName'],
  );
}

function mapSkillSummary(skill, evidenceItems = []) {
  const level = normalizeSkillLevel(skill.level, 2);
  const summary = summarizeSkill(skill, evidenceItems);
  return {
    _id: String(skill._id),
    name: skill.name,
    canonicalName: skill.canonicalName || skill.name,
    normalizedName: skill.normalizedName,
    category: skill.category,
    parentConcepts: skill.parentConcepts || [],
    relatedTo: skill.relatedTo || [],
    level,
    levelLabel: skillLevelLabel(level),
    source: skill.source,
    createdFrom: skill.createdFrom,
    reviewState: summary.reviewState,
    trustLevel: summary.trustLevel,
    mentorApprovalRequired: summary.mentorApprovalRequired,
    evidenceCount: summary.evidenceSummary.totalEvidence,
    bestVerificationStatus: summary.evidenceSummary.bestEvidenceStatus,
    evidenceSummary: summary.evidenceSummary,
    evidence: summary.evidence,
  };
}

export const skillEvidenceService = {
  async create({ userId, reqUser, payload, file }) {
    const skillNames = buildSkillNames(payload);
    if (!skillNames.length) {
      throw new AppError('At least one skill is required', 400, errorCodes.VALIDATION_ERROR);
    }

    if (payload.evidenceType === 'certificate' && !file && !payload.externalLink) {
      throw new AppError('Certificate evidence requires an uploaded file or external link', 400, errorCodes.VALIDATION_ERROR);
    }

    const upload = await uploadEvidenceFile(file);
    const createdEvidence = [];

    for (const skillName of skillNames) {
      const skill = await findOrCreateSkill({
        userId,
        skillName,
        category: payload.category,
        level: payload.level,
        source: payload.evidenceType === 'manual' ? 'manual' : payload.evidenceType,
        createdFrom: payload.evidenceType === 'resume' ? 'resume_parser' : payload.evidenceType,
      });

      const evidence = await skillEvidenceRepository.create(
        buildEvidencePayload({ userId, skill, payload, upload, reqUserId: String(reqUser?._id || userId) }),
      );
      createdEvidence.push(evidence);
      await refreshSkillEvidenceSummary(skill._id);
    }

    await syncProfileSkills(userId);
    return createdEvidence;
  },

  async listMine({ userId, query }) {
    const { filter, sort } = buildEvidenceFilter(query, userId);
    const [items, skills] = await Promise.all([
      skillEvidenceRepository.list(filter, { sort, skip: query.skip, limit: query.limit }),
      skillRepository.listByUserId(userId, { sort: 'name', limit: 500 }),
    ]);
    const skillMap = new Map(skills.map((skill) => [String(skill._id), toPlain(skill)]));
    const groups = new Map();

    for (const item of items) {
      const key = String(item.skillId);
      const skill = skillMap.get(key);
      const existing = groups.get(key) || {
        skillId: key,
        skillLabel: item.skillLabel,
        category: skill?.category || '',
        level: normalizeSkillLevel(skill?.level, 2),
        levelLabel: skillLevelLabel(skill?.level, 2),
        source: skill?.source || item.source || 'manual',
        reviewState: enrichEvidence(item).reviewState,
        trustLevel: enrichEvidence(item).trustLevel,
        evidence: [],
      };

      existing.skillLabel = item.skillLabel;
      existing.category = existing.category || '';
      existing.evidence.push(enrichEvidence(item));
      const summary = summarizeSkill(skill || {}, existing.evidence);
      existing.reviewState = summary.reviewState;
      existing.trustLevel = summary.trustLevel;
      existing.evidenceSummary = summary.evidenceSummary;
      existing.verificationStatus = summary.evidenceSummary.bestEvidenceStatus;
      groups.set(key, existing);
    }

    return {
      items: [...groups.values()],
      total: groups.size,
    };
  },

  async listPending({ reqUser, query }) {
    ensureMentor(reqUser);
    const assignedProfiles = await studentProfileRepository.list(
      { mentorId: reqUser._id },
      { limit: 10000 },
    );
    const assignedUserIds = assignedProfiles.map((profile) => profile.userId);
    const { filter, sort } = buildEvidenceFilter(query);
    filter.$and = [
      ...(filter.$and || []),
      {
        userId: { $in: assignedUserIds },
        mentorApprovalRequired: true,
        reviewState: 'pending_review',
        evidenceType: { $nin: ['resume', 'manual'] },
        source: { $ne: 'resume_parser' },
      },
    ];
    return {
      items: (await skillEvidenceRepository.list(filter, { sort, skip: query.skip, limit: query.limit }))
        .map(enrichEvidence),
      total: await skillEvidenceRepository.count(filter),
    };
  },

  async listSkillsMine(userId) {
    const [skills, evidence] = await Promise.all([
      skillRepository.listByUserId(userId, { sort: 'name', limit: 500 }),
      skillEvidenceRepository.list({ userId }, { sort: '-createdAt', limit: 1000 }),
    ]);

    const evidenceBySkillId = new Map();
    for (const item of evidence) {
      const key = String(item.skillId);
      const bucket = evidenceBySkillId.get(key) || [];
      bucket.push(item);
      evidenceBySkillId.set(key, bucket);
    }

    return skills.map((skill) => mapSkillSummary(skill, evidenceBySkillId.get(String(skill._id)) || []));
  },

  async getById(id, userId, reqUser) {
    const evidence = await skillEvidenceRepository.findById(id);
    if (!evidence) {
      throw new AppError('Skill evidence not found', 404, errorCodes.NOT_FOUND);
    }

    const isOwner = String(evidence.userId) === String(userId);
    const isMentor = reqUser?.role === 'mentor';
    const assignedProfile = isMentor
      ? await studentProfileRepository.findOne({ userId: evidence.userId, mentorId: reqUser._id })
      : null;
    if (!isOwner && !assignedProfile) {
      throw new AppError('You are not allowed to view this evidence', 403, errorCodes.VALIDATION_ERROR);
    }

    return enrichEvidence(evidence);
  },

  async review({ id, reqUser, payload }) {
    ensureMentor(reqUser);
    const evidence = await skillEvidenceRepository.findById(id);
    if (!evidence) {
      throw new AppError('Skill evidence not found', 404, errorCodes.NOT_FOUND);
    }
    const normalizedEvidence = enrichEvidence(evidence);
    const assignedProfile = await studentProfileRepository.findOne({
      userId: evidence.userId,
      mentorId: reqUser._id,
    });
    if (!assignedProfile) {
      throw new AppError('Student is not assigned to this mentor', 403, errorCodes.VALIDATION_ERROR);
    }
    if (!normalizedEvidence.mentorApprovalRequired) {
      throw new AppError('This evidence does not require mentor review', 400, errorCodes.VALIDATION_ERROR);
    }

    const reviewState = payload.decision === 'approved' ? 'mentor_approved' : payload.decision;
    const updated = await skillEvidenceRepository.updateById(id, {
      verificationStatus: verificationStatusForReviewState(reviewState),
      reviewState,
      trustLevel: reviewState === 'mentor_approved' ? 'high' : 'low',
      mentorReview: {
        reviewedBy: String(reqUser._id),
        reviewedAt: new Date(),
        decision: payload.decision,
        comment: payload.comment || '',
      },
    });
    await refreshSkillEvidenceSummary(evidence.skillId);
    await recordActivity({
      actorId: reqUser._id,
      actorRole: 'mentor',
      action: 'mentor_reviewed_evidence',
      targetType: 'SkillEvidence',
      targetId: String(evidence._id),
      message: `${reqUser.name} ${payload.decision} evidence for ${evidence.skillLabel}`,
      metadata: { decision: payload.decision, studentId: evidence.userId },
    });
    return enrichEvidence(updated);
  },

  async delete({ id, userId, reqUser }) {
    const evidence = await skillEvidenceRepository.findById(id);
    if (!evidence) {
      throw new AppError('Skill evidence not found', 404, errorCodes.NOT_FOUND);
    }

    if (String(evidence.userId) !== String(userId) || reqUser?.role === 'mentor') {
      throw new AppError('You are not allowed to delete this evidence', 403, errorCodes.VALIDATION_ERROR);
    }

    if (evidence.filePublicId) {
      await cloudinary.uploader.destroy(evidence.filePublicId, { resource_type: 'auto' });
    }

    const deleted = await skillEvidenceRepository.deleteById(id);
    await refreshSkillEvidenceSummary(evidence.skillId);
    await syncProfileSkills(userId);
    return deleted;
  },
};
