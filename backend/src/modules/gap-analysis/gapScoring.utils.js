import { normalizeSkill, normalizeSkillDetails } from '../../utils/normalizeSkill.js';
import { matchRoleSkillToStudentSkills } from '../../utils/skillMatcher.js';
import {
  normalizeRoleSkillLevel,
  normalizeSkillLevel,
  skillLevelLabel,
} from '../../utils/skillLevel.js';
import { evidenceDefaults, reviewStateWeights } from '../../utils/skillTrust.js';

export const evidenceStatusWeights = {
  ...reviewStateWeights,
};

export function levelValue(level = '') {
  return normalizeSkillLevel(level, 1);
}

function bestStatus(items = []) {
  return items
    .map((item) => evidenceDefaults(item).reviewState)
    .sort((a, b) => (evidenceStatusWeights[b] || 0) - (evidenceStatusWeights[a] || 0))[0] || 'draft';
}

export function consolidateStudentSkills(skills = [], evidence = []) {
  const evidenceBySkill = new Map();
  for (const item of evidence) {
    const key = String(item.skillId || '');
    const bucket = evidenceBySkill.get(key) || [];
    bucket.push(item);
    evidenceBySkill.set(key, bucket);
  }

  return skills.map((skill) => {
    const items = evidenceBySkill.get(String(skill._id)) || [];
    const enrichedEvidence = items.map((item) => ({ ...item, ...evidenceDefaults(item) }));
    const statuses = enrichedEvidence.map((item) => item.reviewState);
    const latestEvidenceDate = items
      .map((item) => item.issueDate || item.submittedAt || item.updatedAt || item.createdAt)
      .filter(Boolean)
      .sort((a, b) => new Date(b) - new Date(a))[0] || null;

    const details = normalizeSkillDetails(skill.canonicalName || skill.name);
    return {
      skillId: String(skill._id),
      name: details.canonicalName,
      canonicalName: details.canonicalName,
      normalizedName: details.normalizedName,
      category: skill.category || details.category,
      aliases: details.aliases,
      parentConcepts: skill.parentConcepts?.length ? skill.parentConcepts : details.parentConcepts,
      relatedSkills: skill.relatedTo?.length ? skill.relatedTo : details.relatedSkills,
      level: normalizeSkillLevel(skill.level, 2),
      levelLabel: skillLevelLabel(skill.level, 2),
      evidence: enrichedEvidence,
      evidenceCount: enrichedEvidence.length,
      approvedEvidenceCount: statuses.filter((status) => status === 'mentor_approved').length,
      studentConfirmedEvidenceCount: statuses.filter((status) => status === 'student_confirmed').length,
      pendingEvidenceCount: statuses.filter((status) => status === 'pending_review').length,
      rejectedEvidenceCount: statuses.filter((status) => status === 'rejected').length,
      changesRequestedCount: statuses.filter((status) => status === 'changes_requested').length,
      bestVerificationStatus: bestStatus(items),
      bestEvidenceConfidence: Math.max(0, ...items.map((item) => Number(item.confidence || 0))),
      latestEvidenceDate,
    };
  });
}

function normalizeRoleSkill(skill = {}) {
  const details = normalizeSkillDetails(skill.canonicalName || skill.name || skill);
  const minimumLevel = normalizeRoleSkillLevel(skill.minimumLevel, 1);
  return {
    name: details.canonicalName,
    canonicalName: details.canonicalName,
    normalizedName: details.normalizedName,
    category: skill.category || details.category,
    aliases: details.aliases,
    parentConcepts: details.parentConcepts,
    relatedSkills: details.relatedSkills,
    importance: skill.importance || 'Medium',
    minimumLevel,
    minimumLevelLabel: skillLevelLabel(minimumLevel),
  };
}

export function classifySkillMatches(role, studentSkills) {
  const verifiedMatches = [];
  const studentConfirmedMatches = [];
  const pendingEvidenceMatches = [];
  const unverifiedMatches = [];
  const partialMatches = [];
  const missingRequiredSkills = [];
  const missingPreferredSkills = [];
  const weakEvidenceSkills = [];
  const requiredCredits = [];
  const evidenceCredits = [];
  let requiredVerifiedCount = 0;
  let requiredUnverifiedCount = 0;
  let requiredPartialCount = 0;

  for (const rawRequirement of role.requiredSkills || []) {
    const requirement = normalizeRoleSkill(rawRequirement);
    const match = matchRoleSkillToStudentSkills(requirement, studentSkills);
    if (!match.matched) {
      missingRequiredSkills.push({
        skillName: requirement.name,
        normalizedName: requirement.normalizedName,
        category: requirement.category,
        importance: requirement.importance,
        minimumLevel: requirement.minimumLevelLabel,
        reason: `${requirement.name} is required for ${role.title} but is not in your skill profile.`,
      });
      requiredCredits.push(0);
      evidenceCredits.push(0);
      continue;
    }

    const matchedStudents = match.matchedStudentSkills;
    const student = [...matchedStudents].sort((a, b) => levelValue(b.level) - levelValue(a.level))[0];
    const allEvidence = matchedStudents.flatMap((item) => item.evidence || []);
    const evidenceStatuses = allEvidence.map((item) => evidenceDefaults(item).reviewState);
    const bestEvidenceStatus = evidenceStatuses
      .sort((a, b) => (evidenceStatusWeights[b] || 0) - (evidenceStatusWeights[a] || 0))[0] || 'draft';
    const approved = evidenceStatuses.includes('mentor_approved');
    const studentConfirmed = evidenceStatuses.includes('student_confirmed');
    const pendingReview = evidenceStatuses.includes('pending_review');
    const belowLevel = student.level < requirement.minimumLevel;
    const matchedNames = matchedStudents.map((item) => item.canonicalName || item.name);
    requiredCredits.push(match.confidence * (belowLevel ? 0.5 : 1));
    evidenceCredits.push((evidenceStatusWeights[bestEvidenceStatus] || 0) * match.confidence);

    if (belowLevel) {
      requiredPartialCount += 1;
      partialMatches.push({
        skillName: requirement.name,
        normalizedName: requirement.normalizedName,
        requiredLevel: requirement.minimumLevelLabel,
        studentLevel: student.levelLabel,
        evidenceCount: allEvidence.length,
        bestEvidenceStatus,
        evidenceStatuses,
        gap: Math.max(1, requirement.minimumLevel - student.level),
        matchedStudentSkills: matchedNames,
        matchType: match.matchType,
        confidence: match.confidence,
        explanation: `${match.explanation} Your current level is ${student.levelLabel}, below the required ${requirement.minimumLevelLabel} level.`,
      });
    } else if (approved) {
      requiredVerifiedCount += 1;
      verifiedMatches.push({
        skillName: requirement.name,
        normalizedName: requirement.normalizedName,
        roleImportance: requirement.importance,
        requiredLevel: requirement.minimumLevelLabel,
        studentLevel: student.levelLabel,
        evidenceCount: allEvidence.length,
        bestEvidenceStatus,
        matchedStudentSkills: matchedNames,
        matchType: match.matchType,
        confidence: match.confidence,
        explanation: `${match.explanation} The matched skill meets the required level and has mentor-approved evidence.`,
      });
    } else if (studentConfirmed) {
      requiredVerifiedCount += 1;
      studentConfirmedMatches.push({
        skillName: requirement.name,
        normalizedName: requirement.normalizedName,
        roleImportance: requirement.importance,
        requiredLevel: requirement.minimumLevelLabel,
        studentLevel: student.levelLabel,
        evidenceCount: allEvidence.length,
        bestEvidenceStatus,
        evidenceStatuses,
        matchedStudentSkills: matchedNames,
        matchType: match.matchType,
        confidence: match.confidence,
        explanation: `${match.explanation} The level requirement is met with student-confirmed resume or manual evidence.`,
      });
    } else if (pendingReview) {
      requiredUnverifiedCount += 1;
      pendingEvidenceMatches.push({
        skillName: requirement.name,
        normalizedName: requirement.normalizedName,
        roleImportance: requirement.importance,
        requiredLevel: requirement.minimumLevelLabel,
        studentLevel: student.levelLabel,
        evidenceCount: allEvidence.length,
        bestEvidenceStatus,
        evidenceStatuses,
        matchedStudentSkills: matchedNames,
        matchType: match.matchType,
        confidence: match.confidence,
        explanation: `${match.explanation} The level requirement is met, but the supporting evidence is awaiting mentor review.`,
      });
    } else {
      requiredUnverifiedCount += 1;
      unverifiedMatches.push({
        skillName: requirement.name,
        normalizedName: requirement.normalizedName,
        roleImportance: requirement.importance,
        requiredLevel: requirement.minimumLevelLabel,
        studentLevel: student.levelLabel,
        evidenceCount: allEvidence.length,
        bestEvidenceStatus,
        evidenceStatuses,
        matchedStudentSkills: matchedNames,
        matchType: match.matchType,
        confidence: match.confidence,
        explanation: `${match.explanation} The level requirement is met, but approved evidence is missing.`,
      });
    }

    const bestConfidence = Math.max(0, ...allEvidence.map((item) => Number(item.confidence || 0)));
    if ((!approved && !studentConfirmed) || bestConfidence < 0.6) {
      weakEvidenceSkills.push({
        skillName: requirement.name,
        normalizedName: requirement.normalizedName,
        issue: !allEvidence.length
          ? 'No evidence submitted'
          : `Best evidence status is ${bestEvidenceStatus.replaceAll('_', ' ')}`,
        recommendation: `Add strong project, certificate, or mentor-approved evidence for ${requirement.name}.`,
      });
    }
  }

  let preferredMatched = 0;
  for (const rawPreference of role.preferredSkills || []) {
    const preference = normalizeRoleSkill(rawPreference);
    const match = matchRoleSkillToStudentSkills(preference, studentSkills);
    if (match.matched) {
      preferredMatched += 1;
      const evidence = match.matchedStudentSkills.flatMap((item) => item.evidence || []);
      const statuses = evidence.map((item) => evidenceDefaults(item).reviewState);
      const approved = statuses.includes('mentor_approved');
      const studentConfirmed = statuses.includes('student_confirmed');
      const pendingReview = statuses.includes('pending_review');
      const bestStatus = statuses.sort((a, b) => (evidenceStatusWeights[b] || 0) - (evidenceStatusWeights[a] || 0))[0] || 'draft';
      const strongest = [...match.matchedStudentSkills].sort((a, b) => levelValue(b.level) - levelValue(a.level))[0];
      const summary = {
        skillName: preference.name,
        normalizedName: preference.normalizedName,
        roleImportance: 'Preferred',
        requiredLevel: preference.minimumLevelLabel,
        studentLevel: strongest.levelLabel,
        evidenceCount: evidence.length,
        bestEvidenceStatus: bestStatus,
        evidenceStatuses: statuses,
        matchedStudentSkills: match.matchedStudentSkills.map((item) => item.canonicalName || item.name),
        matchType: match.matchType,
        confidence: match.confidence,
        explanation: `${match.explanation} This is a preferred role skill.`,
      };

      if (strongest.level < preference.minimumLevel) {
        partialMatches.push({ ...summary, gap: preference.minimumLevel - strongest.level });
      } else if (approved) {
        verifiedMatches.push(summary);
      } else if (studentConfirmed) {
        studentConfirmedMatches.push(summary);
      } else if (pendingReview) {
        pendingEvidenceMatches.push(summary);
      } else {
        unverifiedMatches.push(summary);
      }

      if (!approved) {
        weakEvidenceSkills.push({
          skillName: preference.name,
          normalizedName: preference.normalizedName,
          issue: `Preferred skill matched through ${match.matchedStudentSkills.map((item) => item.name).join(', ')} without approved evidence`,
          recommendation: `Verify ${preference.name} to strengthen operational fit.`,
        });
      }
    } else {
      missingPreferredSkills.push({
        skillName: preference.name,
        normalizedName: preference.normalizedName,
        category: preference.category,
        importance: 'Preferred',
        minimumLevel: preference.minimumLevelLabel,
        reason: `${preference.name} is preferred for ${role.title} but is not in your skill profile.`,
      });
    }
  }

  return {
    verifiedMatches,
    studentConfirmedMatches,
    pendingEvidenceMatches,
    unverifiedMatches,
    partialMatches,
    missingRequiredSkills,
    missingPreferredSkills,
    weakEvidenceSkills: [...new Map(weakEvidenceSkills.map((item) => [item.normalizedName, item])).values()],
    requiredCredits,
    evidenceCredits,
    preferredMatched,
    requiredVerifiedCount,
    requiredUnverifiedCount,
    requiredPartialCount,
  };
}

function score(rawScore, maxWeight, explanation) {
  const raw = Math.max(0, Math.min(100, Math.round(rawScore)));
  return {
    rawScore: raw,
    weightedScore: Number(((raw * maxWeight) / 100).toFixed(2)),
    maxWeight,
    explanation,
  };
}

export function calculateComponentScores({ profile, studentSkills, evidence, role, matches }) {
  const profileChecks = [
    Boolean(profile.personal?.fullName),
    Boolean(profile.education?.institution),
    Boolean(profile.education?.degree),
    Boolean(profile.education?.graduationYear),
    Boolean(profile.resume?.fileName || profile.resume?.url),
    studentSkills.length >= 5,
    evidence.length >= 1,
  ];
  const profileRaw = (profileChecks.filter(Boolean).length / profileChecks.length) * 100;
  const requiredTotal = Math.max((role.requiredSkills || []).length, 1);
  const coreRaw = (matches.requiredCredits.reduce((sum, value) => sum + value, 0) / requiredTotal) * 100;
  const evidenceRaw = (matches.evidenceCredits.reduce((sum, value) => sum + value, 0) / requiredTotal) * 100;

  const preferredTotal = (role.preferredSkills || []).length;
  const targetAligned =
    normalizeSkill(profile.personal?.targetRole || '') === normalizeSkill(role.title || '');
  const compatibilityRaw = preferredTotal
    ? (matches.preferredMatched / preferredTotal) * 80 + (targetAligned ? 20 : 0)
    : targetAligned ? 80 : 60;

  const approvedEvidence = evidence.filter(
    (item) => ['mentor_approved', 'system_verified'].includes(evidenceDefaults(item).reviewState),
  );
  const trustValues = approvedEvidence.map((item) => {
    const date = item.issueDate || item.submittedAt || item.updatedAt || item.createdAt;
    const ageDays = date ? (Date.now() - new Date(date).getTime()) / 86400000 : 9999;
    const recency = ageDays <= 365 ? 1 : 0.6;
    return recency * Math.max(0.3, Number(item.confidence || 0.5));
  });
  const pendingOnly = !approvedEvidence.length && evidence.some(
    (item) => evidenceDefaults(item).reviewState === 'pending_review',
  );
  const trustRaw = trustValues.length
    ? (trustValues.reduce((sum, value) => sum + value, 0) / trustValues.length) * 100
    : pendingOnly ? 25 : 0;

  return {
    profileCompleteness: score(
      profileRaw,
      15,
      `${profileChecks.filter(Boolean).length} of ${profileChecks.length} profile readiness checks are complete.`,
    ),
    coreEligibility: score(
      coreRaw,
      30,
      `${matches.requiredVerifiedCount} verified, ${matches.requiredUnverifiedCount} unverified, and ${matches.requiredPartialCount} partial required-skill matches.`,
    ),
    evidenceStrength: score(
      evidenceRaw,
      25,
      `${approvedEvidence.length} evidence item(s) are mentor approved; pending and changes-requested evidence receive partial weight.`,
    ),
    compatibility: score(
      compatibilityRaw,
      20,
      `${matches.preferredMatched} of ${preferredTotal} preferred skills match${targetAligned ? ', and the profile target aligns with the role' : ''}.`,
    ),
    trustAndRecency: score(
      trustRaw,
      10,
      approvedEvidence.length
        ? `${approvedEvidence.length} approved evidence item(s) were scored by confidence and recency.`
        : pendingOnly ? 'Only pending evidence is available, so trust receives limited credit.' : 'No approved evidence is available yet.',
    ),
  };
}

export function buildRecommendations(role, matches) {
  const recommendations = [
    ...matches.missingRequiredSkills.map((item) => `Learn ${item.skillName} because it is required for ${role.title}.`),
    ...matches.partialMatches.map((item) =>
      item.gap > 0
        ? `Improve ${item.skillName} from ${item.studentLevel} to ${item.requiredLevel}.`
        : `Broaden your ${item.skillName} foundation beyond ${item.matchedStudentSkills.join(', ')}.`,
    ),
    ...matches.unverifiedMatches.map((item) => `Upload mentor-verifiable evidence for ${item.skillName}.`),
    ...matches.pendingEvidenceMatches.map((item) => `Track mentor review for the submitted ${item.skillName} evidence.`),
    ...matches.weakEvidenceSkills.map((item) => item.recommendation),
    ...matches.missingPreferredSkills.map((item) => `Consider learning ${item.skillName} to improve compatibility with ${role.title}.`),
  ];
  return [...new Set(recommendations)].slice(0, 12);
}
