import { Readable } from 'stream';
import { cloudinary } from '../../config/cloudinary.js';
import { AppError, errorCodes } from '../../errors/index.js';
import { extractResumeSkillsWithReviewMetadata } from '../../integrations/ai/resumeSkillExtractor.js';
import { skillEvidenceRepository } from '../skill-evidence/repository.js';
import { skillRepository } from '../skill/repository.js';
import { studentProfileRepository } from '../student-profile/repository.js';
import { extractTextFromResume } from '../../utils/extractTextFromResume.js';
import { normalizeSkill, normalizeSkillDetails, titleCaseSkill } from '../../utils/normalizeSkill.js';
import { validateResumeFile } from '../../utils/fileValidation.js';
import { containsSensitiveResumeData, redactSensitiveResumeText } from '../../utils/redactSensitiveResumeText.js';
import { resumeRepository } from './resume.repository.js';
import { normalizeSkillLevel, suggestedResumeSkillLevel } from '../../utils/skillLevel.js';
import { refreshSkillEvidenceSummary } from '../skill/evidenceSummary.js';

function uploadBufferToCloudinary(file) {
  return new Promise((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      {
        folder: 'sgip/resumes',
        resource_type: 'raw',
        use_filename: true,
        unique_filename: true,
      },
      (error, result) => {
        if (error) return reject(error);
        return resolve(result);
      },
    );

    Readable.from(file.buffer).pipe(upload);
  });
}

function buildPreview(text = '') {
  return String(text);
}

function publicResume(resume, { includeRawText = false } = {}) {
  const plain = resume?.toObject ? resume.toObject() : resume;
  if (!plain) return null;
  if (!includeRawText) {
    delete plain.rawText;
  }
  if (plain.redactedText) {
    plain.redactedTextPreview = buildPreview(plain.redactedText);
    delete plain.redactedText;
  }
  return plain;
}

function uniqueSkillLabels(skills = []) {
  const byNormalizedName = new Map();

  for (const skill of skills) {
    const details = normalizeSkillDetails(skill?.canonicalName || skill?.name || '');
    const label = details.canonicalName;
    const normalizedName = details.normalizedName;
    if (!label || !normalizedName) continue;

    const existing = byNormalizedName.get(normalizedName);
    if (!existing || Number(skill?.confidence || 0) > Number(existing.confidence || 0)) {
      byNormalizedName.set(normalizedName, {
        label,
        confidence: Number(skill?.confidence || 0),
      });
    }
  }

  return [...byNormalizedName.values()]
    .sort((left, right) => right.confidence - left.confidence || left.label.localeCompare(right.label))
    .map((item) => item.label);
}

async function syncProfileResumeMetadata(userId, resume) {
  const profile = await studentProfileRepository.findByUserId(userId);
  if (!profile) return;

  await studentProfileRepository.updateProfile(profile._id, {
    resume: resume
      ? {
          fileName: resume.originalFileName,
          url: resume.fileUrl,
          publicId: resume.filePublicId,
          mimeType: resume.fileMimeType,
          size: resume.fileSize,
        }
      : {},
  });
}

async function syncProfileSkillLabels(userId, skills = []) {
  const profile = await studentProfileRepository.findByUserId(userId);
  if (!profile) return;

  const labels = uniqueSkillLabels(skills);
  await studentProfileRepository.updateProfile(profile._id, {
    topSkills: labels,
  });
}

async function removePreviousResumes(userId) {
  const existingResumes = await resumeRepository.listByUserId(userId, { sort: '-createdAt', limit: 50 });

  for (const existingResume of existingResumes) {
    if (existingResume.filePublicId) {
      await cloudinary.uploader.destroy(existingResume.filePublicId, { resource_type: 'raw' });
    }
  }

  await resumeRepository.deleteManyByUserId(userId);
}

async function getOwnedResume(id, userId) {
  const resume = await resumeRepository.findOwnedById(id, userId);
  if (!resume) {
    throw new AppError('Resume not found', 404, errorCodes.NOT_FOUND);
  }
  return resume;
}

function toEvidencePayload({ userId, resume, skill }) {
  const skillName = normalizeSkillDetails(skill.name).canonicalName;
  return {
    userId,
    skillLabel: skillName,
    evidenceType: 'resume',
    title: `Resume evidence: ${skillName}`,
    description: containsSensitiveResumeData(skill.evidenceText) ? `Reviewed resume skill: ${skillName}` : skill.evidenceText || `Reviewed resume skill: ${skillName}`,
    fileUrl: resume.fileUrl,
    filePublicId: resume.filePublicId,
    confidence: Math.min(1, Math.max(0, Number(skill.confidence || 0))),
    verificationStatus: 'self_declared',
    reviewState: 'student_confirmed',
    trustLevel: 'medium',
    submittedAt: new Date(),
    source: 'resume_parser',
    mentorApprovalRequired: false,
  };
}

async function upsertSkillEvidenceFromResume({ userId, resume, skills }) {
  const evidenceRecords = [];

  for (const skill of skills) {
    const details = normalizeSkillDetails(skill.name);
    const normalizedName = details.normalizedName;
    const level = normalizeSkillLevel(skill.level, suggestedResumeSkillLevel(skill.confidence));
    let skillRecord = await skillRepository.findByUserAndNormalizedName(userId, normalizedName);
    if (!skillRecord) {
      skillRecord = await skillRepository.create({
        userId,
        name: details.canonicalName,
        originalName: skill.name,
        canonicalName: details.canonicalName,
        normalizedName,
        category: skill.category || details.category,
        parentConcepts: details.parentConcepts,
        relatedTo: details.relatedSkills,
        level,
        source: 'resume_parser',
        sourceDetails: {
          resumeId: String(resume._id),
          fileName: resume.originalFileName,
        },
        reviewState: 'student_confirmed',
        trustLevel: 'medium',
        mentorApprovalRequired: false,
        createdFrom: 'resume_parser',
      });
    } else {
      skillRecord = await skillRepository.updateById(skillRecord._id, {
        level,
        category: skill.category || skillRecord.category || details.category,
        source: skillRecord.source || 'resume_parser',
      });
    }

    const existing = await skillEvidenceRepository.findOne({
      userId,
      skillId: skillRecord._id,
      evidenceType: 'resume',
    });
    const payload = {
      ...toEvidencePayload({ userId, resume, skill: { ...skill, normalizedName } }),
      skillId: skillRecord._id,
    };

    if (existing) {
      evidenceRecords.push(await skillEvidenceRepository.updateById(existing._id, payload));
    } else {
      evidenceRecords.push(await skillEvidenceRepository.create(payload));
    }
    await refreshSkillEvidenceSummary(skillRecord._id);
  }

  return evidenceRecords;
}

export const resumeService = {
  async upload({ file, userId }) {
    validateResumeFile(file);

    const rawText = await extractTextFromResume(file);
    if (!rawText.trim() || rawText.trim().length < 80) {
      throw new AppError('Could not extract readable text from resume', 400, errorCodes.VALIDATION_ERROR);
    }
    const redaction = redactSensitiveResumeText(rawText);
    if (!redaction.redactedText.trim() || redaction.redactedText.trim().length < 80) {
      throw new AppError('Resume text is too short after redaction', 400, errorCodes.VALIDATION_ERROR);
    }

    await removePreviousResumes(userId);

    const uploaded = await uploadBufferToCloudinary(file);
    const resume = await resumeRepository.create({
      userId,
      originalFileName: file.originalname,
      fileUrl: uploaded.secure_url,
      filePublicId: uploaded.public_id,
      fileMimeType: file.mimetype,
      fileSize: file.size,
      rawText: redaction.rawText,
      redactedText: redaction.redactedText,
      redactionSummary: redaction.redactionSummary,
      status: 'redacted',
    });

    await syncProfileResumeMetadata(userId, resume);

    return {
      resume: publicResume(resume),
      preview: buildPreview(redaction.redactedText),
      redactionSummary: redaction.redactionSummary,
    };
  },

  async extractSkills({ id, userId }) {
    const resume = await getOwnedResume(id, userId);
    if (!resume.redactedText?.trim()) {
      throw new AppError('Resume text is unavailable for extraction', 400, errorCodes.VALIDATION_ERROR);
    }

    const extraction = await extractResumeSkillsWithReviewMetadata(resume.redactedText);
    const extractedSkills = extraction.skills.map((skill) => ({
      ...skill,
      level: suggestedResumeSkillLevel(skill.confidence),
    }));
    const updated = await resumeRepository.updateById(id, {
      extractedSkills,
      extractedEducation: extraction.extractedEducation,
      extractedExperience: extraction.extractedExperience,
      extractedCertifications: extraction.extractedCertifications,
      aiMetadata: extraction.aiMetadata,
      status: extractedSkills.length ? 'parsed' : 'extraction_failed',
    });

    await syncProfileSkillLabels(userId, extraction.skills);

    return {
      resume: publicResume(updated),
      extractedSkills: updated.extractedSkills,
      fallbackUsed: Boolean(updated.aiMetadata?.fallbackUsed),
      aiMetadata: updated.aiMetadata,
      redactionSummary: updated.redactionSummary,
      summary: {
        skillsFound: updated.extractedSkills.length,
        redactedBeforeAI: Boolean(updated.aiMetadata?.redactedBeforeAI),
      },
    };
  },

  async review({ id, userId, skills }) {
    const resume = await getOwnedResume(id, userId);
    const reviewedSkills = skills.map((skill) => ({
      name: normalizeSkillDetails(skill.name).canonicalName,
      originalName: skill.name,
      normalizedName: normalizeSkillDetails(skill.name).normalizedName,
      category: skill.category,
      confidence: Math.min(1, Math.max(0, Number(skill.confidence || 0))),
      level: normalizeSkillLevel(skill.level, suggestedResumeSkillLevel(skill.confidence)),
      evidenceText: containsSensitiveResumeData(skill.evidenceText) ? '' : skill.evidenceText || '',
      source: 'user_reviewed_resume',
    }));

    const evidenceRecords = await upsertSkillEvidenceFromResume({ userId, resume, skills: reviewedSkills });
    const updated = await resumeRepository.updateById(id, {
      extractedSkills: reviewedSkills,
      status: 'reviewed',
    });

    await syncProfileSkillLabels(userId, reviewedSkills);

    return {
      resume: publicResume(updated),
      evidenceRecords,
    };
  },

  async list({ userId, skip = 0, limit = 10 }) {
    const latestResume = await resumeRepository.findLatestByUserId(userId);
    const items = latestResume ? [latestResume].slice(skip, skip + limit).map((resume) => publicResume(resume)) : [];
    return {
      items,
      total: latestResume ? 1 : 0,
    };
  },

  async getById({ id, userId, includeRawText = false }) {
    const resume = await getOwnedResume(id, userId);
    return publicResume(resume, { includeRawText });
  },

  async delete({ id, userId }) {
    const resume = await getOwnedResume(id, userId);
    if (resume.filePublicId) {
      await cloudinary.uploader.destroy(resume.filePublicId, { resource_type: 'raw' });
    }
    await resumeRepository.deleteById(id);
    await syncProfileResumeMetadata(userId, null);
    await syncProfileSkillLabels(userId, []);
    return { deleted: true, id };
  },
};
