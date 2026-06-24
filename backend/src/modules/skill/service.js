import { skillRepository } from './repository.js';
import { skillEvidenceRepository } from '../skill-evidence/repository.js';
import { AppError, errorCodes } from '../../errors/index.js';
import { normalizeSkillLevel, skillLevelLabel } from '../../utils/skillLevel.js';
import { summarizeSkill } from './evidenceSummary.js';

function toPlain(doc) {
  if (!doc) return null;
  return typeof doc.toObject === 'function' ? doc.toObject() : doc;
}

export const skillService = {
  async listMine(userId) {
    const [skills, evidence] = await Promise.all([
      skillRepository.listByUserId(userId, { sort: 'name', limit: 500 }),
      skillEvidenceRepository.list({ userId }, { sort: '-createdAt', limit: 1000 }),
    ]);

    const evidenceBySkillId = new Map();
    for (const item of evidence) {
      const key = String(item.skillId);
      const bucket = evidenceBySkillId.get(key) || [];
      bucket.push(toPlain(item));
      evidenceBySkillId.set(key, bucket);
    }

    return skills.map((skill) => {
      const items = evidenceBySkillId.get(String(skill._id)) || [];
      const plainSkill = toPlain(skill);
      const level = normalizeSkillLevel(plainSkill.level, 2);
      const summary = summarizeSkill(plainSkill, items);
      return {
        ...plainSkill,
        level,
        levelLabel: skillLevelLabel(level),
        source: plainSkill.source === 'resume' ? 'resume_parser' : plainSkill.source,
        reviewState: summary.reviewState,
        trustLevel: summary.trustLevel,
        mentorApprovalRequired: summary.mentorApprovalRequired,
        evidenceCount: summary.evidenceSummary.totalEvidence,
        bestVerificationStatus: summary.evidenceSummary.bestEvidenceStatus,
        evidenceSummary: summary.evidenceSummary,
      };
    });
  },

  async updateLevel({ id, userId, level }) {
    const skill = await skillRepository.updateOwnedLevel(id, userId, normalizeSkillLevel(level));
    if (!skill) {
      throw new AppError('Skill not found', 404, errorCodes.NOT_FOUND);
    }

    const plainSkill = toPlain(skill);
    return {
      ...plainSkill,
      level: normalizeSkillLevel(plainSkill.level),
      levelLabel: skillLevelLabel(plainSkill.level),
    };
  },
};
