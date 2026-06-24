const studentConfirmedTypes = new Set(['resume', 'manual']);
const mentorReviewedTypes = new Set([
  'certificate',
  'internship',
  'project',
  'assessment',
  'coding_platform',
  'research',
  'competition',
]);

export const reviewStateWeights = Object.freeze({
  mentor_approved: 1,
  system_verified: 0.9,
  student_confirmed: 0.7,
  pending_review: 0.4,
  changes_requested: 0.2,
  rejected: 0,
});

export function evidenceDefaults(evidence = {}) {
  const evidenceType = evidence.evidenceType || 'manual';
  const verificationStatus = evidence.verificationStatus || '';
  const studentConfirmed = studentConfirmedTypes.has(evidenceType);

  let reviewState = studentConfirmed ? 'student_confirmed' : evidence.reviewState;
  if (!studentConfirmed && verificationStatus === 'approved') reviewState = 'mentor_approved';
  if (!studentConfirmed && verificationStatus === 'rejected') reviewState = 'rejected';
  if (!studentConfirmed && verificationStatus === 'changes_requested') reviewState = 'changes_requested';
  if (!reviewState) {
    if (verificationStatus === 'approved') reviewState = 'mentor_approved';
    else if (verificationStatus === 'rejected') reviewState = 'rejected';
    else if (verificationStatus === 'changes_requested') reviewState = 'changes_requested';
    else if (studentConfirmed || verificationStatus === 'self_declared') reviewState = 'student_confirmed';
    else reviewState = 'pending_review';
  }

  const mentorApprovalRequired = studentConfirmed
    ? false
    : evidence.mentorApprovalRequired ?? mentorReviewedTypes.has(evidenceType);

  let trustLevel = studentConfirmed ? 'medium' : evidence.trustLevel;
  if (!trustLevel) {
    if (['mentor_approved', 'system_verified'].includes(reviewState)) trustLevel = 'high';
    else if (reviewState === 'student_confirmed') trustLevel = 'medium';
    else trustLevel = 'low';
  }

  const source =
    evidence.source ||
    (evidenceType === 'resume' ? 'resume_parser' : evidenceType === 'manual' ? 'manual' : evidenceType);

  return { reviewState, trustLevel, mentorApprovalRequired, source };
}

export function verificationStatusForReviewState(reviewState) {
  const statuses = {
    student_confirmed: 'self_declared',
    pending_review: 'pending',
    mentor_approved: 'approved',
    rejected: 'rejected',
    changes_requested: 'changes_requested',
    system_verified: 'approved',
  };
  return statuses[reviewState] || 'pending';
}

export function computeEvidenceSummary(items = []) {
  const normalized = items.map((item) => ({ ...item, ...evidenceDefaults(item) }));
  const ranked = [...normalized].sort((left, right) => {
    const stateDifference =
      (reviewStateWeights[right.reviewState] || 0) - (reviewStateWeights[left.reviewState] || 0);
    if (stateDifference) return stateDifference;
    return Number(right.confidence || 0) - Number(left.confidence || 0);
  });
  const best = ranked[0];

  return {
    totalEvidence: normalized.length,
    approvedEvidence: normalized.filter((item) => item.reviewState === 'mentor_approved').length,
    studentConfirmedEvidence: normalized.filter((item) => item.reviewState === 'student_confirmed').length,
    pendingEvidence: normalized.filter((item) => item.reviewState === 'pending_review').length,
    rejectedEvidence: normalized.filter((item) => item.reviewState === 'rejected').length,
    bestEvidenceStatus: best?.reviewState || 'student_confirmed',
    bestEvidenceType: best?.evidenceType || '',
    bestEvidenceConfidence: Number(best?.confidence || 0),
  };
}

export function skillTrustState(skill = {}, evidenceSummary = {}) {
  const bestState = evidenceSummary.bestEvidenceStatus;
  if (bestState === 'mentor_approved') {
    return { reviewState: 'mentor_approved', trustLevel: 'high' };
  }
  if (bestState === 'system_verified') {
    return { reviewState: 'system_verified', trustLevel: 'high' };
  }
  if (bestState === 'pending_review' && !evidenceSummary.studentConfirmedEvidence) {
    return { reviewState: 'pending_review', trustLevel: 'low' };
  }
  if (bestState === 'changes_requested' && !evidenceSummary.studentConfirmedEvidence) {
    return { reviewState: 'changes_requested', trustLevel: 'low' };
  }
  if (bestState === 'rejected' && !evidenceSummary.studentConfirmedEvidence) {
    return { reviewState: 'rejected', trustLevel: 'low' };
  }
  return {
    reviewState: skill.reviewState || 'student_confirmed',
    trustLevel: skill.trustLevel || 'medium',
  };
}
