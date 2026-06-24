import { env } from '../../config/index.js';
import { containsSensitiveResumeData } from '../../utils/redactSensitiveResumeText.js';
import { normalizeSkill, titleCaseSkill } from '../../utils/normalizeSkill.js';
import { requestAiJson, resolveAiSettings } from './aiProvider.js';
import { allowedCategories, resumeSkillExtractionSchema } from './schemas/resumeSkillSchema.js';

const promptVersion = 'resume-skill-extraction-v2-redacted';
const resumeParserSystemInstruction =
  'You are an efficient applicant tracking system parser. Do not reason verbosely or overanalyze. Extract technical and soft skills directly from the provided resume text and return valid JSON only.';
const resumeResponseSchema = {
  type: 'object',
  properties: {
    skills: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          normalizedName: { type: 'string' },
          category: { type: 'string' },
          confidence: { type: 'number' },
          evidenceText: { type: 'string' },
          source: { type: 'string' },
        },
        required: ['name', 'category', 'confidence'],
      },
    },
    education: {
      type: 'array',
      items: { type: 'string' },
    },
    experience: {
      type: 'array',
      items: { type: 'string' },
    },
    certifications: {
      type: 'array',
      items: { type: 'string' },
    },
    overallConfidence: { type: 'number' },
  },
  required: ['skills', 'education', 'experience', 'certifications', 'overallConfidence'],
};

const fallbackDictionary = [
  { name: 'Python', category: 'Programming' },
  { name: 'Java', category: 'Programming' },
  { name: 'C', category: 'Programming', standalone: true },
  { name: 'C++', category: 'Programming' },
  { name: 'SQL', category: 'Programming' },
  { name: 'Artificial Intelligence', category: 'Data/AI' },
  { name: 'Machine Learning', category: 'Data/AI' },
  { name: 'Data Analysis', category: 'Data/AI' },
  { name: 'Data Visualization', category: 'Data/AI', aliases: ['Data Visualisation'] },
  { name: 'NumPy', category: 'Data/AI' },
  { name: 'Pandas', category: 'Data/AI' },
  { name: 'Scikit-learn', category: 'Data/AI', aliases: ['Scikit learn', 'Sklearn'] },
  { name: 'Matplotlib', category: 'Data/AI' },
  { name: 'Seaborn', category: 'Data/AI' },
  { name: 'NLP', category: 'Data/AI', aliases: ['Natural Language Processing'] },
  { name: 'Resume Parsing', category: 'Data/AI', aliases: ['Resume and job-description parsing', 'Resume and job description parsing'] },
  { name: 'Job Description Parsing', category: 'Data/AI', aliases: ['job-description parsing', 'Resume and job-description parsing', 'Resume and job description parsing'] },
  { name: 'Skill Extraction', category: 'Data/AI' },
  { name: 'Skill Normalization', category: 'Data/AI', aliases: ['Skill Normalisation', 'normalization', 'normalisation', 'normalization and structured skill profiling', 'normalisation and structured skill profiling'] },
  { name: 'Structured Skill Profiling', category: 'Data/AI' },
  { name: 'Answer Evaluation', category: 'Data/AI', aliases: ['evaluate answers', 'evaluate answer', 'evaluating answers'] },
  { name: 'Face Recognition', category: 'Computer Vision', aliases: ['Facial Recognition', 'face-recognition'] },
  { name: 'Webcam Integration', category: 'Computer Vision', aliases: ['Webcam'] },
  { name: 'Intruder Detection', category: 'Computer Vision' },
  { name: 'Flask', category: 'Backend' },
  { name: 'Django', category: 'Backend' },
  { name: 'Node.js', category: 'Backend', aliases: ['Nodejs'] },
  { name: 'Express.js', category: 'Backend', aliases: ['Expressjs'] },
  { name: 'REST API', category: 'Backend' },
  { name: 'MySQL', category: 'Database' },
  { name: 'PostgreSQL', category: 'Database' },
  { name: 'Firebase', category: 'Cloud' },
  { name: 'AWS', category: 'Cloud' },
  { name: 'Git', category: 'Tools' },
  { name: 'GitHub', category: 'Tools' },
  { name: 'GUI', category: 'Tools' },
  { name: 'Email Alerts', category: 'Tools', aliases: ['automated email alerts'] },
  { name: 'Recommendation System', category: 'Domain Skill', aliases: ['Recommendations'] },
  { name: 'Gap Analysis', category: 'Domain Skill' },
  { name: 'Question Generation', category: 'Domain Skill' },
  { name: 'Difficulty Adjustment', category: 'Domain Skill', aliases: ['adjust the difficulty', 'difficulty level'] },
];
const canonicalSkillCatalog = fallbackDictionary.map((entry) => ({
  name: entry.name,
  normalizedName: normalizeSkill(entry.name),
  category: entry.category,
  aliases: [entry.name, ...(entry.aliases || [])].map((alias) => normalizeSkill(alias)).filter(Boolean),
}));

function splitLines(text = '') {
  return String(text)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function getSection(lineIndex, lines) {
  for (let index = lineIndex; index >= 0; index -= 1) {
    const line = lines[index].toLowerCase();
    if (/technical\s+skills|skills|technologies/.test(line)) return 'skills';
    if (/projects?/.test(line)) return 'projects';
    if (/experience|work/.test(line)) return 'experience';
    if (/education/.test(line)) return 'education';
  }
  return 'other';
}

function isHeaderContactEvidence(line = '') {
  return /\[REDACTED_|linkedin|portfolio/i.test(line) && !/\b(skill|project|built|using|technology|technologies)\b/i.test(line);
}

function buildSkillRegex(skill) {
  if (skill.standalone) return /(?:^|[^\w])C(?:$|[^\w+#])/;
  return new RegExp(`(^|[^\\w])${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=$|[^\\w])`, 'i');
}

function findSkillHit(text, lines, entry) {
  const names = [entry.name, ...(entry.aliases || [])];
  for (const name of names) {
    const regex = buildSkillRegex(name);
    const normalizedName = normalizeSkill(name);
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      const normalizedLine = normalizeSkill(line);
      const matched = entry.standalone ? regex.test(line) : regex.test(line) || normalizedLine.includes(normalizedName);
      if (!matched) continue;
      if (isHeaderContactEvidence(line)) continue;
      const section = getSection(index, lines);
      if (entry.name === 'C' && section !== 'skills') continue;
      if (entry.name === 'Git' && /github/i.test(line) && section !== 'skills') continue;
      if (entry.name === 'GitHub' && section !== 'skills' && /profile|linkedin|portfolio|\[REDACTED/i.test(line)) continue;
      if (entry.name === 'Artificial Intelligence' && section === 'education' && !/project|skill|technical/i.test(text)) continue;
      return { line, section };
    }
  }
  return null;
}

function confidenceForSection(section) {
  if (section === 'skills') return 0.95;
  if (section === 'projects') return 0.85;
  return 0.7;
}

function looksLikeCompositeSkill(value = '') {
  const normalized = normalizeSkill(value);
  const words = normalized.split(' ').filter(Boolean);
  return (
    words.length >= 3 &&
    /\b(and|based|using|with|through|for|driven|powered|processing|parsing)\b|[/,&-]/i.test(String(value || ''))
  );
}

function resolveCanonicalSkills(rawSkill) {
  const rawName = String(rawSkill?.name || '').trim();
  const rawNormalizedName = String(rawSkill?.normalizedName || '').trim();
  const targetName = normalizeSkill(rawName);
  const targetNormalizedName = normalizeSkill(rawNormalizedName);
  const target = normalizeSkill(`${rawName} ${rawNormalizedName}`);
  if (!targetName && !targetNormalizedName && !target) return [];

  const exactMatch = canonicalSkillCatalog.find(
    (entry) =>
      (targetName && entry.aliases.includes(targetName)) ||
      (targetNormalizedName && entry.aliases.includes(targetNormalizedName)) ||
      (target && entry.aliases.includes(target)),
  );
  if (exactMatch) {
    return [exactMatch];
  }

  if (!looksLikeCompositeSkill(rawName) && !looksLikeCompositeSkill(rawNormalizedName)) {
    return [];
  }

  const matches = canonicalSkillCatalog.filter((entry) =>
    entry.aliases.some((alias) => alias.length > 2 && target.includes(alias)),
  );

  return matches.sort((left, right) => right.normalizedName.length - left.normalizedName.length);
}

function deterministicFallback(redactedText = '') {
  const lines = splitLines(redactedText);
  const bySkill = new Map();

  for (const entry of fallbackDictionary) {
    const hit = findSkillHit(redactedText, lines, entry);
    if (!hit) continue;
    const normalizedName = normalizeSkill(entry.name);
    const confidence = confidenceForSection(hit.section);
    const existing = bySkill.get(normalizedName);
    if (existing && existing.confidence >= confidence) continue;
    bySkill.set(normalizedName, {
      name: entry.name,
      normalizedName,
      category: entry.category,
      confidence,
      evidenceText: hit.line.slice(0, 180),
      source: 'deterministic_fallback',
    });
  }

  const skills = [...bySkill.values()];
  return {
    skills,
    education: [],
    experience: [],
    certifications: [],
    overallConfidence: skills.length ? Math.max(...skills.map((skill) => skill.confidence)) : 0,
  };
}

function normalizeOutput(output, redactedText) {
  const parsed = resumeSkillExtractionSchema.parse(output);
  const lines = splitLines(redactedText);
  const bySkill = new Map();

  parsed.skills.forEach((skill) => {
    const canonicalMatches = resolveCanonicalSkills(skill);
    const evidenceText = String(skill.evidenceText || '').slice(0, 180);
    if (containsSensitiveResumeData(evidenceText)) return;
    const expandedSkills = canonicalMatches.length
      ? canonicalMatches.map((match) => ({
          name: match.name,
          normalizedName: match.normalizedName,
          category: match.category,
          confidence: Number(skill.confidence),
          evidenceText: evidenceText || findFallbackEvidence(lines, match.name),
          source: skill.source || 'resume',
        }))
      : [
          {
            name: titleCaseSkill(skill.name),
            normalizedName: normalizeSkill(skill.normalizedName || skill.name),
            category: skill.category,
            confidence: Number(skill.confidence),
            evidenceText: evidenceText || findFallbackEvidence(lines, skill.name),
            source: skill.source || 'resume',
          },
        ];

    expandedSkills.forEach((nextSkill) => {
      if (!nextSkill.normalizedName) return;

      const existing = bySkill.get(nextSkill.normalizedName);
      if (!existing) {
        bySkill.set(nextSkill.normalizedName, nextSkill);
        return;
      }

      const existingEvidenceLength = (existing.evidenceText || '').length;
      const nextEvidenceLength = (nextSkill.evidenceText || '').length;
      const shouldReplace =
        nextSkill.confidence > existing.confidence ||
        (nextSkill.confidence === existing.confidence && nextEvidenceLength > existingEvidenceLength);

      if (shouldReplace) {
        bySkill.set(nextSkill.normalizedName, nextSkill);
      } else if (!existing.evidenceText && nextSkill.evidenceText) {
        bySkill.set(nextSkill.normalizedName, { ...existing, evidenceText: nextSkill.evidenceText });
      }
    });
  });

  const skills = [...bySkill.values()]
    .map((skill) => {
      const evidenceText = String(skill.evidenceText || '').slice(0, 180);
      return {
        name: skill.name,
        normalizedName: skill.normalizedName,
        category: skill.category,
        confidence: Number(skill.confidence),
        evidenceText,
        source: skill.source || 'resume',
      };
    })
    .filter(Boolean);

  return {
    skills,
    extractedEducation: parsed.education,
    extractedExperience: parsed.experience,
    extractedCertifications: parsed.certifications,
    confidence: Number(parsed.overallConfidence || 0),
  };
}

function findFallbackEvidence(lines, skillName) {
  const normalized = normalizeSkill(skillName);
  const line = lines.find((item) => normalizeSkill(item).includes(normalized) && !isHeaderContactEvidence(item));
  return (line || '').slice(0, 180);
}

function prepareResumeTextForAi(text = '') {
  return String(text || '')
    .normalize('NFKC')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[�]/g, '')
    .trim();
}

export async function extractResumeSkillsWithReviewMetadata(redactedText = '') {
  const settings = resolveAiSettings();
  const processedAt = new Date();
  const trimmedText = prepareResumeTextForAi(String(redactedText || '')).slice(0, env.AI_MAX_INPUT_CHARS || 20000);
  const prompt = `
The resume text below has already been redacted. Do not infer name, phone, email, identity, gender, address, or private information.
Extract only professional skills, tools, technologies, libraries, frameworks, databases, cloud platforms, AI/data concepts, and project-derived technical abilities.
Do not treat personal links or social profile labels as skills.
Return JSON only. No markdown. No explanation.
Do not include sensitive info in evidenceText.
Allowed categories only: ${allowedCategories.join(', ')}.
Required JSON shape:
{"skills":[{"name":"Python","normalizedName":"python","category":"Programming","confidence":0.95,"evidenceText":"Programming Languages: Python, Java","source":"resume"}],"education":[],"experience":[],"certifications":[],"overallConfidence":0.85}
Resume text:
${trimmedText}
`;

  try {
    const response = await requestAiJson({
      prompt,
      systemInstruction: resumeParserSystemInstruction,
      responseSchema: resumeResponseSchema,
      timeoutMs: env.AI_TIMEOUT_MS || 15000,
    });
    const extracted = normalizeOutput(response.data, trimmedText);
    if (!extracted.skills.length) throw new Error('AI returned no valid skills');
    return {
      ...extracted,
      aiMetadata: {
        provider: response.provider,
        model: response.model,
        promptVersion,
        processedAt,
        confidence: extracted.confidence,
        fallbackUsed: false,
        redactedBeforeAI: true,
        attemptedProviders: response.attempts.map((attempt) => `${attempt.provider}:${attempt.model}`),
        failureReason: response.attempts.length
          ? `Recovered after provider failures: ${response.attempts.map((attempt) => attempt.message).join(' | ')}`
          : '',
      },
    };
  } catch (error) {
    const fallback = normalizeOutput(deterministicFallback(trimmedText), trimmedText);
    return {
      ...fallback,
      aiMetadata: {
        provider: settings.provider || 'fallback',
        model: settings.model || 'deterministic-dictionary',
        promptVersion,
        processedAt,
        confidence: fallback.confidence,
        fallbackUsed: true,
        redactedBeforeAI: true,
        attemptedProviders: Array.isArray(error?.attempts)
          ? error.attempts.map((attempt) => `${attempt.provider}:${attempt.model}`)
          : [],
        failureReason: error?.message || 'AI extraction failed and deterministic fallback was used',
      },
    };
  }
}
