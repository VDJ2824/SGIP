import { computeEvidenceSummary, evidenceDefaults, skillTrustState } from '../../utils/skillTrust.js';
import { skillEvidenceRepository } from '../skill-evidence/repository.js';
import { skillRepository } from './repository.js';

function toPlain(doc) {
  if (!doc) return null;
  return typeof doc.toObject === 'function' ? doc.toObject() : doc;
}

export function enrichEvidence(evidence) {
  const plain = toPlain(evidence);
  return plain ? { ...plain, ...evidenceDefaults(plain) } : null;
}

export function summarizeSkill(skill, evidenceItems = []) {
  const plainSkill = toPlain(skill);
  const enrichedEvidence = evidenceItems.map(enrichEvidence).filter(Boolean);
  const evidenceSummary = computeEvidenceSummary(enrichedEvidence);
  const state = skillTrustState(plainSkill, evidenceSummary);

  return {
    evidence: enrichedEvidence,
    evidenceSummary,
    reviewState: state.reviewState,
    trustLevel: state.trustLevel,
    mentorApprovalRequired: Boolean(
      enrichedEvidence.some((item) => item.mentorApprovalRequired && item.reviewState === 'pending_review'),
    ),
  };
}

export async function refreshSkillEvidenceSummary(skillId) {
  const [skill, evidenceItems] = await Promise.all([
    skillRepository.findById(skillId),
    skillEvidenceRepository.list({ skillId }, { sort: '-createdAt', limit: 1000 }),
  ]);
  if (!skill) return null;

  const summary = summarizeSkill(skill, evidenceItems);
  return skillRepository.updateById(skillId, {
    evidenceSummary: summary.evidenceSummary,
    reviewState: summary.reviewState,
    trustLevel: summary.trustLevel,
    mentorApprovalRequired: summary.mentorApprovalRequired,
  });
}
