import { normalizeSkill, normalizeSkillDetails, titleCaseSkill } from '../../utils/normalizeSkill.js';

const canonicalRoleMap = new Map([
  ['software engineer', 'Software Engineer'],
  ['software developer', 'Software Engineer'],
  ['data scientist', 'Data Scientist'],
  ['data analyst', 'Data Analyst'],
  ['machine learning engineer', 'Machine Learning Engineer'],
  ['ml engineer', 'Machine Learning Engineer'],
  ['ai ml engineer', 'Machine Learning Engineer'],
  ['ai engineer', 'AI Engineer'],
  ['artificial intelligence engineer', 'AI Engineer'],
  ['backend developer', 'Backend Developer'],
  ['backend engineer', 'Backend Developer'],
  ['frontend developer', 'Frontend Developer'],
  ['front end developer', 'Frontend Developer'],
  ['front-end developer', 'Frontend Developer'],
  ['full stack developer', 'Full Stack Developer'],
  ['fullstack developer', 'Full Stack Developer'],
  ['devops engineer', 'DevOps Engineer'],
  ['dev ops engineer', 'DevOps Engineer'],
  ['cloud engineer', 'Cloud Engineer'],
  ['cybersecurity analyst', 'Cybersecurity Analyst'],
  ['cyber security analyst', 'Cybersecurity Analyst'],
  ['security analyst', 'Cybersecurity Analyst'],
]);

export function normalizeRoleText(value = '') {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/full\s*stack/g, 'full stack')
    .replace(/fullstack/g, 'full stack')
    .replace(/front\s*end/g, 'frontend')
    .replace(/back\s*end/g, 'backend')
    .replace(/dev\s*ops/g, 'devops')
    .replace(/\bml\b/g, 'machine learning')
    .replace(/\bai\b/g, 'artificial intelligence')
    .replace(/\bswe\b/g, 'software engineer')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeRoleTitle(value = '') {
  const normalized = normalizeRoleText(value);
  return normalizeSkill(normalized);
}

export function roleSlug(value = '') {
  return normalizeRoleTitle(value).replace(/\s+/g, '-');
}

export function formatRoleTitle(value = '') {
  const normalized = normalizeRoleTitle(value);
  if (!normalized) return '';
  if (canonicalRoleMap.has(normalized)) return canonicalRoleMap.get(normalized);

  return normalized
    .split(' ')
    .filter(Boolean)
    .map((part) => {
      if (part === 'ai') return 'AI';
      if (part === 'ml') return 'ML';
      if (part === 'devops') return 'DevOps';
      if (part === 'ui') return 'UI';
      if (part === 'ux') return 'UX';
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(' ');
}

export function canonicalizeRoleQuery(value = '') {
  const normalized = normalizeRoleTitle(value);
  return canonicalRoleMap.has(normalized) ? normalizeRoleTitle(canonicalRoleMap.get(normalized)) : normalized;
}

export function uniqueStrings(values = []) {
  const seen = new Set();
  const output = [];

  for (const value of values) {
    const text = String(value || '').trim();
    if (!text) continue;
    const key = normalizeRoleTitle(text);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    output.push(text);
  }

  return output;
}

export function normalizeRoleAliases(title = '', aliases = []) {
  return uniqueStrings([title, ...aliases])
    .map((alias) => formatRoleTitle(alias))
    .filter(Boolean)
    .filter((alias) => normalizeRoleTitle(alias) !== normalizeRoleTitle(title));
}

export function normalizeImportance(value = '') {
  const normalized = normalizeRoleTitle(value);
  if (['critical', 'must have', 'must-have', 'high'].includes(normalized)) return 'High';
  if (['medium', 'important', 'should have', 'should-have'].includes(normalized)) return 'Medium';
  return 'Low';
}

export function normalizeMinimumLevel(value = '') {
  const normalized = normalizeRoleTitle(value);
  if (['advanced', 'expert', 'senior'].includes(normalized)) return 'Advanced';
  if (['beginner', 'foundation', 'basic', 'entry'].includes(normalized)) return 'Beginner';
  return 'Intermediate';
}

export function normalizeSkillCategory(value = '') {
  const normalized = normalizeRoleTitle(value);
  if (!normalized) return 'General';
  return normalized
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function normalizeRoleSkillRequirement(skill = {}) {
  const details = normalizeSkillDetails(skill?.canonicalName || skill?.name || skill);
  if (!details.normalizedName) return null;

  return {
    name: details.canonicalName,
    canonicalName: details.canonicalName,
    normalizedName: details.normalizedName,
    category: skill?.category || details.category,
    importance: normalizeImportance(skill?.importance),
    minimumLevel: normalizeMinimumLevel(skill?.minimumLevel),
  };
}

export function normalizePreferredRoleSkill(skill = {}) {
  const details = normalizeSkillDetails(skill?.canonicalName || skill?.name || skill);
  if (!details.normalizedName) return null;

  return {
    name: details.canonicalName,
    canonicalName: details.canonicalName,
    normalizedName: details.normalizedName,
    category: skill?.category || details.category,
  };
}

export function dedupeRoleSkills(skills = [], mapper = normalizeRoleSkillRequirement) {
  const seen = new Set();
  const output = [];

  for (const skill of skills) {
    const normalized = mapper(skill);
    if (!normalized) continue;
    const key = normalized.normalizedName || normalizeSkill(normalized.name);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    output.push(normalized);
  }

  return output;
}

function tokenize(value = '') {
  return normalizeRoleTitle(value)
    .split(' ')
    .filter(Boolean);
}

function diceCoefficient(left = '', right = '') {
  if (!left || !right) return 0;
  if (left === right) return 1;
  if (left.length < 2 || right.length < 2) return 0;

  const pairs = new Map();
  for (let index = 0; index < left.length - 1; index += 1) {
    const pair = left.slice(index, index + 2);
    pairs.set(pair, (pairs.get(pair) || 0) + 1);
  }

  let intersection = 0;
  for (let index = 0; index < right.length - 1; index += 1) {
    const pair = right.slice(index, index + 2);
    const count = pairs.get(pair) || 0;
    if (count > 0) {
      pairs.set(pair, count - 1);
      intersection += 1;
    }
  }

  return (2 * intersection) / (left.length + right.length - 2);
}

function tokenOverlap(left = '', right = '') {
  const leftTokens = new Set(tokenize(left));
  const rightTokens = new Set(tokenize(right));
  if (!leftTokens.size || !rightTokens.size) return 0;

  let intersection = 0;
  for (const token of leftTokens) {
    if (rightTokens.has(token)) intersection += 1;
  }

  return intersection / Math.max(leftTokens.size, rightTokens.size);
}

export function computeRoleSimilarity(query = '', candidate = '') {
  const left = canonicalizeRoleQuery(query);
  const right = canonicalizeRoleQuery(candidate);
  if (!left || !right) return 0;
  if (left === right) return 100;
  if (left.includes(right) || right.includes(left)) return 88;

  return Math.round(Math.max(diceCoefficient(left, right), tokenOverlap(left, right)) * 100);
}

export function normalizeRolePayload(payload = {}, overrides = {}) {
  const title = formatRoleTitle(payload.title || '');
  const normalizedTitle = canonicalizeRoleQuery(title);

  return {
    title,
    normalizedTitle,
    slug: roleSlug(title),
    aliases: normalizeRoleAliases(title, payload.aliases || []),
    category: normalizeSkillCategory(payload.category || 'Software'),
    companyType: normalizeSkillCategory(payload.category || payload.companyType || 'Software'),
    description: String(payload.description || '').trim(),
    experienceLevel: normalizeSkillCategory(payload.experienceLevel || 'Entry Level'),
    level: normalizeSkillCategory(payload.experienceLevel || payload.level || 'Entry Level'),
    requiredSkills: dedupeRoleSkills(payload.requiredSkills || [], normalizeRoleSkillRequirement),
    preferredSkills: dedupeRoleSkills(payload.preferredSkills || [], normalizePreferredRoleSkill),
    roadmapHints: uniqueStrings(payload.roadmapHints || []).map((hint) => String(hint).trim()),
    source: payload.source || overrides.source || 'manual',
    reviewStatus: payload.reviewStatus || overrides.reviewStatus || 'approved',
    aiMetadata: {
      provider: payload.aiMetadata?.provider || overrides.aiMetadata?.provider || '',
      model: payload.aiMetadata?.model || overrides.aiMetadata?.model || '',
      promptVersion: payload.aiMetadata?.promptVersion || overrides.aiMetadata?.promptVersion || '',
      generatedAt: payload.aiMetadata?.generatedAt || overrides.aiMetadata?.generatedAt || null,
      confidence: Number(payload.aiMetadata?.confidence ?? overrides.aiMetadata?.confidence ?? 0),
    },
  };
}
