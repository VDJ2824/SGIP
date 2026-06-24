import { z } from 'zod';
import { requestStructuredOutput } from './provider.js';
import { normalizedSkillSchema } from './schemas.js';

const inputSchema = z.object({
  skills: z.array(z.string()).min(1),
});

const knownCategories = {
  javascript: 'Frontend',
  typescript: 'Frontend',
  react: 'Frontend',
  nodejs: 'Backend',
  node: 'Backend',
  express: 'Backend',
  sql: 'Databases',
  mongodb: 'Databases',
  postgres: 'Databases',
  docker: 'DevOps',
  kubernetes: 'DevOps',
  aws: 'Cloud',
  testing: 'Quality Assurance',
  jest: 'Quality Assurance',
  git: 'Tools',
};

function normalizeSkill(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function fallbackNormalize(skills = []) {
  return skills.map((skill) => {
    const normalized = normalizeSkill(skill);
    const key = normalized.replace(/\s+/g, '');
    return {
      original: skill,
      normalized: normalized.replace(/\b\w/g, (c) => c.toUpperCase()),
      category: knownCategories[key] || knownCategories[normalized.split(' ')[0]] || 'General',
      aliases: [skill],
      confidence: 80,
    };
  });
}

export async function normalizeSkills(input) {
  const parsed = inputSchema.parse(input);
  const skills = await requestStructuredOutput({
    prompt: `Normalize the following skills and return JSON with shape {"skills":[{"original":"","normalized":"","category":"","aliases":[],"confidence":0}]}: ${JSON.stringify(parsed.skills)}`,
    schema: z.object({ skills: z.array(normalizedSkillSchema) }),
    fallback: async () => ({ skills: fallbackNormalize(parsed.skills) }),
  });

  return skills.skills;
}
