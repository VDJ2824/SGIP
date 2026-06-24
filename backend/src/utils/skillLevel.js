export const skillLevelLabels = Object.freeze({
  1: 'Beginner',
  2: 'Intermediate',
  3: 'Advanced',
});

const labelValues = Object.freeze({
  beginner: 1,
  intermediate: 2,
  advanced: 3,
});

export function normalizeSkillLevel(value, fallback = 2) {
  const numeric = Number(value);
  if (Number.isInteger(numeric) && numeric >= 1 && numeric <= 3) return numeric;

  const fromLabel = labelValues[String(value || '').trim().toLowerCase()];
  return fromLabel || fallback;
}

export function skillLevelLabel(value, fallback = 2) {
  return skillLevelLabels[normalizeSkillLevel(value, fallback)];
}

export function normalizeRoleSkillLevel(value, fallback = 1) {
  const normalized = String(value || '').trim().toLowerCase();
  if (labelValues[normalized]) return labelValues[normalized];

  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  if (numeric <= 2) return 1;
  if (numeric === 3) return 2;
  return 3;
}

export function suggestedResumeSkillLevel(confidence = 0) {
  return Number(confidence) >= 0.9 ? 2 : 1;
}
