import { AppError, errorCodes } from '../../errors/index.js';
import { studentProfileRepository } from '../student-profile/repository.js';
import { skillRepository } from '../skill/repository.js';
import { skillEvidenceRepository } from '../skill-evidence/repository.js';
import { careerRoleRepository } from '../career-role/repository.js';
import { gapAnalysisRepository } from './repository.js';
import {
  buildRecommendations,
  calculateComponentScores,
  classifySkillMatches,
  consolidateStudentSkills,
} from './gapScoring.utils.js';
import { normalizeSkillDetails } from '../../utils/normalizeSkill.js';
import { recordActivity } from '../admin/activity.service.js';

function toPlain(doc) {
  if (!doc) return null;
  return typeof doc.toObject === 'function' ? doc.toObject() : doc;
}

function roleSnapshot(role) {
  const normalizeRoleSkills = (items = []) =>
    items.map((skill) => {
      const details = normalizeSkillDetails(skill.canonicalName || skill.name || skill);
      return {
        ...skill,
        name: details.canonicalName,
        canonicalName: details.canonicalName,
        normalizedName: details.normalizedName,
        category: skill.category || details.category,
      };
    });

  return {
    title: role.title,
    category: role.category,
    experienceLevel: role.experienceLevel,
    source: role.source,
    reviewStatus: role.reviewStatus,
    requiredSkills: normalizeRoleSkills(role.requiredSkills),
    preferredSkills: normalizeRoleSkills(role.preferredSkills),
  };
}

export const gapAnalysisService = {
  async run({ userId, careerRoleId }) {
    const [profileDoc, roleDoc, skillsDocs, evidenceDocs] = await Promise.all([
      studentProfileRepository.findByUserId(userId),
      careerRoleRepository.findById(careerRoleId),
      skillRepository.listByUserId(userId, { sort: 'name', limit: 500 }),
      skillEvidenceRepository.list({ userId }, { sort: '-createdAt', limit: 2000 }),
    ]);

    if (!profileDoc) throw new AppError('Complete your student profile before running gap analysis', 400, errorCodes.VALIDATION_ERROR);
    if (!roleDoc) throw new AppError('Career role not found', 404, errorCodes.NOT_FOUND);

    const profile = toPlain(profileDoc);
    const role = toPlain(roleDoc);
    const skills = skillsDocs.map(toPlain);
    const evidence = evidenceDocs.map(toPlain);
    const studentSkills = consolidateStudentSkills(skills, evidence);
    const matches = classifySkillMatches(role, studentSkills);
    const componentScores = calculateComponentScores({ profile, studentSkills, evidence, role, matches });
    const readinessScore = Number(
      Object.values(componentScores).reduce((sum, component) => sum + component.weightedScore, 0).toFixed(2),
    );
    const recommendations = buildRecommendations(role, matches);

    const report = await gapAnalysisRepository.create({
      userId,
      careerRoleId,
      targetRoleSnapshot: roleSnapshot(role),
      readinessScore,
      componentScores,
      verifiedMatches: matches.verifiedMatches,
      studentConfirmedMatches: matches.studentConfirmedMatches,
      pendingEvidenceMatches: matches.pendingEvidenceMatches,
      unverifiedMatches: matches.unverifiedMatches,
      partialMatches: matches.partialMatches,
      missingRequiredSkills: matches.missingRequiredSkills,
      missingPreferredSkills: matches.missingPreferredSkills,
      weakEvidenceSkills: matches.weakEvidenceSkills,
      recommendations,
      roadmapInput: {
        prioritySkills: [
          ...matches.missingRequiredSkills.map((item) => item.skillName),
          ...matches.partialMatches.map((item) => item.skillName),
        ],
        strengthenSkills: matches.partialMatches.map((item) => item.skillName),
        verifySkills: [
          ...matches.unverifiedMatches.map((item) => item.skillName),
          ...matches.pendingEvidenceMatches.map((item) => item.skillName),
          ...matches.weakEvidenceSkills.map((item) => item.skillName),
        ],
      },
      aiEnhancedExplanation: { used: false },
      status: 'generated',
    });

    await studentProfileRepository.updateProfile(profileDoc._id, {
      overallReadiness: Math.round(readinessScore),
      personal: {
        ...profile.personal,
        targetRole: role.title,
        targetRoleId: String(role._id),
        targetRoleSource: role.source,
        targetRoleReviewStatus: role.reviewStatus,
        targetRoleSelectedAt: profile.personal?.targetRoleSelectedAt || new Date(),
      },
    });

    await recordActivity({
      actorId: userId,
      actorRole: 'student',
      action: 'student_generated_gap_report',
      targetType: 'GapAnalysisReport',
      targetId: String(report._id),
      message: `Generated gap analysis for ${role.title}`,
      metadata: { careerRoleId: String(role._id), readinessScore },
    });

    return report;
  },

  async latest(userId) {
    return gapAnalysisRepository.findLatestForUser(userId);
  },

  async getById(id, userId) {
    const report = await gapAnalysisRepository.findOwnedById(id, userId);
    if (!report) throw new AppError('Gap report not found', 404, errorCodes.NOT_FOUND);
    return report;
  },

  async history(userId, { skip = 0, limit = 10 } = {}) {
    const [items, total] = await Promise.all([
      gapAnalysisRepository.listForUser(userId, { sort: '-createdAt', skip, limit }),
      gapAnalysisRepository.countForUser(userId),
    ]);
    return { items, total };
  },

  async archive(id, userId) {
    const report = await gapAnalysisRepository.archiveOwned(id, userId);
    if (!report) throw new AppError('Gap report not found', 404, errorCodes.NOT_FOUND);
    return report;
  },
};
