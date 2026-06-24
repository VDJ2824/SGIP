import { z } from 'zod';

export const allowedCategories = [
  'Programming',
  'Frontend',
  'Backend',
  'Database',
  'Cloud',
  'Data/AI',
  'Computer Vision',
  'Tools',
  'Soft Skill',
  'Domain Skill',
  'Other',
];

function normalizeCategoryValue(value) {
  const raw = String(value || '').trim();
  if (!raw) return 'Other';
  if (allowedCategories.includes(raw)) return raw;

  const normalized = raw.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

  const aliases = new Map([
    ['programming', 'Programming'],
    ['programming language', 'Programming'],
    ['programming languages', 'Programming'],
    ['language', 'Programming'],
    ['languages', 'Programming'],
    ['frontend', 'Frontend'],
    ['front end', 'Frontend'],
    ['ui', 'Frontend'],
    ['backend', 'Backend'],
    ['back end', 'Backend'],
    ['api', 'Backend'],
    ['apis', 'Backend'],
    ['web backend', 'Backend'],
    ['database', 'Database'],
    ['databases', 'Database'],
    ['sql', 'Database'],
    ['cloud', 'Cloud'],
    ['devops', 'Cloud'],
    ['infra', 'Cloud'],
    ['infrastructure', 'Cloud'],
    ['data ai', 'Data/AI'],
    ['data science', 'Data/AI'],
    ['data analytics', 'Data/AI'],
    ['analytics', 'Data/AI'],
    ['ai', 'Data/AI'],
    ['ml', 'Data/AI'],
    ['ai ml', 'Data/AI'],
    ['machine learning', 'Data/AI'],
    ['artificial intelligence', 'Data/AI'],
    ['nlp', 'Data/AI'],
    ['computer vision', 'Computer Vision'],
    ['vision', 'Computer Vision'],
    ['cv', 'Computer Vision'],
    ['tools', 'Tools'],
    ['tool', 'Tools'],
    ['platform', 'Tools'],
    ['soft skill', 'Soft Skill'],
    ['soft skills', 'Soft Skill'],
    ['interpersonal', 'Soft Skill'],
    ['domain skill', 'Domain Skill'],
    ['domain skills', 'Domain Skill'],
    ['business', 'Domain Skill'],
    ['product', 'Domain Skill'],
    ['other', 'Other'],
    ['misc', 'Other'],
    ['miscellaneous', 'Other'],
  ]);

  return aliases.get(normalized) || 'Other';
}

export const resumeExtractedSkillSchema = z.object({
  name: z.string().min(1).max(80),
  normalizedName: z.string().min(1).max(100).optional(),
  category: z.preprocess(normalizeCategoryValue, z.enum(allowedCategories)).default('Other'),
  confidence: z.coerce.number().min(0).max(1),
  evidenceText: z.preprocess((value) => String(value || '').slice(0, 180), z.string().max(180)).optional().default(''),
  source: z.string().optional().default('resume'),
});

export const resumeSkillExtractionSchema = z.object({
  skills: z.array(resumeExtractedSkillSchema).max(40),
  education: z.array(z.string().max(200)).optional().default([]),
  experience: z.array(z.string().max(300)).optional().default([]),
  certifications: z.array(z.string().max(200)).optional().default([]),
  overallConfidence: z.coerce.number().min(0).max(1).optional().default(0),
});
