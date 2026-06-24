import { z } from 'zod';
import { AppError, errorCodes } from '../../errors/index.js';
import { buildListQuery } from '../../common/query.js';
import { requestAiJson } from '../../integrations/ai/aiProvider.js';
import { careerRoleRepository } from './repository.js';
import { seededCareerRoles } from './seedData.js';
import {
  canonicalizeRoleQuery,
  computeRoleSimilarity,
  formatRoleTitle,
  normalizeRolePayload,
  normalizeRoleTitle,
} from './utils.js';

const aiPromptVersion = 'career-role-generator-v1';

const skillLikeSchema = z.union([
  z.string().min(1),
  z.object({
    name: z.string().min(1),
    category: z.string().optional().default('General'),
    importance: z.string().optional().default('Medium'),
    minimumLevel: z.string().optional().default('Intermediate'),
  }),
]);

const aiRoleResponseSchema = z.object({
  title: z.string().min(1),
  category: z.string().min(1),
  description: z.string().min(20),
  experienceLevel: z.string().min(1),
  requiredSkills: z.array(skillLikeSchema).min(4).max(12),
  preferredSkills: z.array(skillLikeSchema).max(10).default([]),
  roadmapHints: z.array(z.string().min(4)).min(3).max(8),
});

function escapeRegex(value = '') {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toPlain(doc) {
  if (!doc) return null;
  return typeof doc.toObject === 'function' ? doc.toObject() : doc;
}

function roleSearchKeys(role = {}) {
  return [role.title, role.normalizedTitle, ...(role.aliases || [])].filter(Boolean);
}

function requiredSkillNames(role = {}) {
  return (role.requiredSkills || []).map((skill) => skill.name).filter(Boolean);
}

function preferredSkillNames(role = {}) {
  return (role.preferredSkills || []).map((skill) => skill.name).filter(Boolean);
}

function buildSearchTokens(query = '') {
  return canonicalizeRoleQuery(query)
    .split(' ')
    .filter(Boolean)
    .slice(0, 4);
}

function toRequiredSkillObject(skill, fallbackCategory = 'General') {
  if (typeof skill === 'string') {
    return {
      name: skill,
      category: fallbackCategory,
      importance: 'Medium',
      minimumLevel: 'Intermediate',
    };
  }

  return {
    name: skill?.name || '',
    category: skill?.category || fallbackCategory,
    importance: skill?.importance || 'Medium',
    minimumLevel: skill?.minimumLevel || 'Intermediate',
  };
}

function toPreferredSkillObject(skill, fallbackCategory = 'General') {
  if (typeof skill === 'string') {
    return {
      name: skill,
      category: fallbackCategory,
    };
  }

  return {
    name: skill?.name || '',
    category: skill?.category || fallbackCategory,
  };
}

function coerceAiRolePayload(payload = {}) {
  return {
    title: payload.title || '',
    category: payload.category || 'Software Engineering',
    description: payload.description || '',
    experienceLevel: payload.experienceLevel || payload.level || 'Entry Level',
    requiredSkills: (payload.requiredSkills || []).map((skill) => toRequiredSkillObject(skill, payload.category || 'General')),
    preferredSkills: (payload.preferredSkills || []).map((skill) => toPreferredSkillObject(skill, payload.category || 'General')),
    roadmapHints: Array.isArray(payload.roadmapHints) ? payload.roadmapHints : [],
  };
}

function buildFallbackRole(query) {
  const normalized = canonicalizeRoleQuery(query);
  const fallbackLibrary = {
    'software engineer': {
      title: 'Software Engineer',
      category: 'Software Engineering',
      description: 'Build reliable application features across services, APIs, data flows, and user-facing product functionality.',
      experienceLevel: 'Entry Level',
      requiredSkills: [
        { name: 'Programming', category: 'Software Engineering', importance: 'High', minimumLevel: 'Intermediate' },
        { name: 'Data Structures', category: 'Computer Science', importance: 'High', minimumLevel: 'Intermediate' },
        { name: 'Algorithms', category: 'Computer Science', importance: 'High', minimumLevel: 'Intermediate' },
        { name: 'Git', category: 'Professional', importance: 'Medium', minimumLevel: 'Intermediate' },
        { name: 'APIs', category: 'Backend', importance: 'Medium', minimumLevel: 'Beginner' },
      ],
      preferredSkills: [
        { name: 'System Design', category: 'Architecture' },
        { name: 'Testing', category: 'Quality' },
        { name: 'SQL', category: 'Data' },
      ],
      roadmapHints: [
        'Build and deploy one end-to-end application',
        'Practice data structures and algorithms consistently',
        'Add testing, debugging, and version-control proof to projects',
      ],
    },
  };

  return fallbackLibrary[normalized] || {
    title: formatRoleTitle(query),
    category: 'Software Engineering',
    description: `A structured target role for ${formatRoleTitle(query)} focused on core engineering readiness and practical delivery skills.`,
    experienceLevel: 'Entry Level',
    requiredSkills: [
      { name: 'Programming', category: 'Software Engineering', importance: 'High', minimumLevel: 'Intermediate' },
      { name: 'Problem Solving', category: 'Professional', importance: 'High', minimumLevel: 'Intermediate' },
      { name: 'Git', category: 'Professional', importance: 'Medium', minimumLevel: 'Beginner' },
      { name: 'Communication', category: 'Professional', importance: 'Medium', minimumLevel: 'Beginner' },
    ],
    preferredSkills: [
      { name: 'Testing', category: 'Quality' },
      { name: 'System Design', category: 'Architecture' },
    ],
    roadmapHints: [
      'Ship one project aligned with this role',
      'Strengthen verified evidence for the required skills',
      'Practice common interview and implementation scenarios',
    ],
  };
}

let seedWarmupPromise = null;
const normalizedSeedCatalog = seededCareerRoles.map((role) =>
  normalizeRolePayload(role, { source: 'seeded', reviewStatus: 'approved' }),
);

async function ensureSeededCatalog() {
  if (!seedWarmupPromise) {
    seedWarmupPromise = (async () => {
      try {
        await careerRoleService.seedDefaults(seededCareerRoles);
      } catch {
        // Keep role APIs usable even if catalog warm-up hits legacy data problems.
      }
    })().finally(() => {
      seedWarmupPromise = null;
    });
  }

  await seedWarmupPromise;
}

function findBestSeededRole(query) {
  const ranked = normalizedSeedCatalog
    .map((role) => ({
      role,
      similarity: Math.max(...roleSearchKeys(role).map((key) => computeRoleSimilarity(query, key))),
      matchType: 'seeded',
    }))
    .sort((left, right) => right.similarity - left.similarity);

  return ranked[0] || null;
}

async function findBestExistingRole(query) {
  const normalizedQuery = canonicalizeRoleQuery(query);
  const exact = await careerRoleRepository.findByNormalizedTitle(normalizedQuery);
  if (exact) {
    return { role: toPlain(exact), similarity: 100, matchType: 'exact' };
  }

  const aliasMatch = await careerRoleRepository.findByAliasOrTitle(formatRoleTitle(query));
  if (aliasMatch) {
    return { role: toPlain(aliasMatch), similarity: 98, matchType: 'alias' };
  }

  const tokens = buildSearchTokens(query);
  const candidates = await careerRoleRepository.findCandidates(tokens, 60);
  const ranked = (candidates || [])
    .map((role) => {
      const plainRole = toPlain(role);
      const score = Math.max(...roleSearchKeys(plainRole).map((key) => computeRoleSimilarity(query, key)));
      return {
        role: plainRole,
        similarity: score,
        matchType: score >= 95 ? 'alias' : 'fuzzy',
      };
    })
    .sort((left, right) => right.similarity - left.similarity);

  return ranked[0] || null;
}

async function generateRoleWithAi(query) {
  const prompt = [
    'Generate a structured software career role as JSON only.',
    'Do not include markdown.',
    'Do not include commentary.',
    'Return valid JSON with keys exactly: title, category, description, experienceLevel, requiredSkills, preferredSkills, roadmapHints.',
    'Each required skill must include: name, category, importance, minimumLevel.',
    'Each preferred skill must include: name, category.',
    'Remove duplicates.',
    'Normalize skill names.',
    `Target role query: ${query}`,
  ].join(' ');

  try {
    const result = await requestAiJson({
      prompt,
      systemInstruction:
        'You generate clean career role catalog entries. Return only valid JSON. Never output markdown. If uncertain, produce the closest standard industry role.',
    });

    const parsed = aiRoleResponseSchema.safeParse(coerceAiRolePayload(result.data));
    if (!parsed.success) {
      const fallback = buildFallbackRole(query);
      return {
        normalized: normalizeRolePayload(fallback, {
          source: 'ai_generated',
          reviewStatus: 'pending',
          aiMetadata: {
            provider: result.provider,
            model: result.model,
            promptVersion: aiPromptVersion,
            generatedAt: new Date(),
            confidence: 0.35,
          },
        }),
        provider: result.provider,
        model: result.model,
        usedFallback: true,
      };
    }

    return {
      normalized: normalizeRolePayload(parsed.data, {
        source: 'ai_generated',
        reviewStatus: 'pending',
        aiMetadata: {
          provider: result.provider,
          model: result.model,
          promptVersion: aiPromptVersion,
          generatedAt: new Date(),
          confidence: 0.72,
        },
      }),
      provider: result.provider,
      model: result.model,
      usedFallback: false,
    };
  } catch (error) {
    const fallback = buildFallbackRole(query);
    return {
      normalized: normalizeRolePayload(fallback, {
        source: 'ai_generated',
        reviewStatus: 'pending',
        aiMetadata: {
          provider: 'fallback',
          model: '',
          promptVersion: aiPromptVersion,
          generatedAt: new Date(),
          confidence: 0.2,
        },
      }),
      provider: 'fallback',
      model: '',
      usedFallback: true,
      failureReason: error?.message || 'AI request failed',
    };
  }
}

export const careerRoleService = {
  async create(payload) {
    const normalized = normalizeRolePayload(payload);
    if (!normalized.title || !normalized.requiredSkills.length) {
      throw new AppError('Career role title and required skills are required', 400, errorCodes.VALIDATION_ERROR);
    }

    const existing = await careerRoleRepository.findByNormalizedTitle(normalized.normalizedTitle);
    if (existing) {
      throw new AppError('Career role already exists', 409, errorCodes.CONFLICT);
    }

    return careerRoleRepository.create(normalized);
  },

  async list(query = {}) {
    await ensureSeededCatalog();
    const search = query.search ? formatRoleTitle(query.search) : '';
    const { filter, sort } = buildListQuery(
      {
        search,
        sortBy: query.sortBy || 'title',
        filters: {
          ...(query.category ? { category: query.category } : {}),
          ...(query.experienceLevel ? { experienceLevel: query.experienceLevel } : {}),
          ...(query.source ? { source: query.source } : {}),
          ...(query.reviewStatus ? { reviewStatus: query.reviewStatus } : {}),
        },
      },
      ['title', 'normalizedTitle', 'aliases', 'category', 'description', 'requiredSkills.name', 'preferredSkills.name'],
    );

    return {
      items: await careerRoleRepository.list(filter, { sort, skip: query.skip, limit: query.limit }),
      total: await careerRoleRepository.count(filter),
    };
  },

  async getById(id) {
    await ensureSeededCatalog();
    const role = await careerRoleRepository.findById(id);
    if (!role) {
      throw new AppError('Career role not found', 404, errorCodes.NOT_FOUND);
    }
    return role;
  },

  async update(id, payload) {
    const existing = await careerRoleRepository.findById(id);
    if (!existing) {
      throw new AppError('Career role not found', 404, errorCodes.NOT_FOUND);
    }

    const next = normalizeRolePayload({ ...toPlain(existing), ...payload, aiMetadata: { ...toPlain(existing).aiMetadata, ...payload.aiMetadata } });
    if (next.normalizedTitle !== existing.normalizedTitle) {
      const conflict = await careerRoleRepository.findByNormalizedTitle(next.normalizedTitle);
      if (conflict && String(conflict._id) !== String(id)) {
        throw new AppError('Career role already exists', 409, errorCodes.CONFLICT);
      }
    }

    return careerRoleRepository.updateById(id, next);
  },

  async delete(id) {
    const role = await careerRoleRepository.deleteById(id);
    if (!role) {
      throw new AppError('Career role not found', 404, errorCodes.NOT_FOUND);
    }
    return role;
  },

  async searchOrGenerate(query) {
    await ensureSeededCatalog();
    const trimmedQuery = String(query || '').trim();
    if (!trimmedQuery) {
      throw new AppError('query is required', 400, errorCodes.VALIDATION_ERROR);
    }

    const seededMatch = findBestSeededRole(trimmedQuery);
    if (seededMatch && seededMatch.similarity >= 80) {
      const persisted =
        (await careerRoleRepository.findByNormalizedTitle(seededMatch.role.normalizedTitle)) ||
        (await careerRoleRepository.upsertByNormalizedTitle(seededMatch.role.normalizedTitle, seededMatch.role));

      return {
        role: toPlain(persisted),
        generated: false,
        reused: true,
        matchType: seededMatch.matchType,
        similarity: seededMatch.similarity,
      };
    }

    const existing = await findBestExistingRole(trimmedQuery);
    if (existing && existing.similarity >= 80) {
      return {
        role: existing.role,
        generated: false,
        reused: true,
        matchType: existing.matchType,
        similarity: existing.similarity,
      };
    }

    const aiResult = await generateRoleWithAi(trimmedQuery);
    const exactAfterGeneration = await careerRoleRepository.findByNormalizedTitle(aiResult.normalized.normalizedTitle);
    if (exactAfterGeneration) {
      return {
        role: toPlain(exactAfterGeneration),
        generated: false,
        reused: true,
        matchType: 'generated_match',
        similarity: 100,
      };
    }

    const created = await careerRoleRepository.create(aiResult.normalized);
    return {
      role: created,
      generated: true,
      reused: false,
      matchType: 'ai_generated',
      similarity: 0,
      usedFallback: aiResult.usedFallback || false,
    };
  },

  async seedDefaults(seedRoles = []) {
    const results = [];
    for (const payload of seedRoles) {
      const normalized = normalizeRolePayload(payload, { source: 'seeded', reviewStatus: 'approved' });
      if (!normalized.normalizedTitle) continue;
      const role = await careerRoleRepository.upsertByNormalizedTitle(normalized.normalizedTitle, normalized);
      results.push(role);
    }
    return results;
  },

  getRoleSkillNames(role = {}) {
    return {
      requiredSkills: requiredSkillNames(role),
      preferredSkills: preferredSkillNames(role),
    };
  },
};
