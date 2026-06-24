export const skillLevels = [
  { value: 1, label: 'Beginner' },
  { value: 2, label: 'Intermediate' },
  { value: 3, label: 'Advanced' },
];

export function normalizeSkillLevel(value, fallback = 2) {
  const numeric = Number(value);
  if (Number.isInteger(numeric) && numeric >= 1 && numeric <= 3) return numeric;

  const labels = { beginner: 1, intermediate: 2, advanced: 3 };
  return labels[String(value || '').toLowerCase()] || fallback;
}

export function skillLevelLabel(value, fallback = 2) {
  return skillLevels.find((level) => level.value === normalizeSkillLevel(value, fallback))?.label || 'Intermediate';
}

export function suggestedResumeSkillLevel(confidence = 0) {
  return Number(confidence) >= 0.9 ? 2 : 1;
}

export function normalizeRoleLevel(value, fallback = 1) {
  const labels = { beginner: 1, intermediate: 2, advanced: 3 };
  const normalized = String(value || '').toLowerCase();
  if (labels[normalized]) return labels[normalized];

  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  if (numeric <= 2) return 1;
  if (numeric === 3) return 2;
  return 3;
}
