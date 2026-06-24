import { findTaxonomySkill, taxonomyKey } from './skillTaxonomy.js';

export function normalizeSkill(value = '') {
  return String(value)
    .trim()
    .replace(/[^\w\s+#.]/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

export function normalizeSkillDetails(value = '') {
  const originalName = String(value || '').trim();
  const taxonomy = findTaxonomySkill(originalName);
  const canonicalName = taxonomy?.canonicalName || titleCaseSkill(originalName);

  return {
    originalName,
    canonicalName,
    normalizedName: taxonomyKey(canonicalName),
    category: taxonomy?.category || 'General',
    aliases: taxonomy?.aliases || [originalName].filter(Boolean),
    parentConcepts: (taxonomy?.parentConcepts || []).map(taxonomyKey),
    relatedSkills: (taxonomy?.relatedSkills || []).map(taxonomyKey),
    isKnownSkill: Boolean(taxonomy),
  };
}

export function titleCaseSkill(value = '') {
  const known = new Map([
    ['html', 'HTML'],
    ['css', 'CSS'],
    ['javascript', 'JavaScript'],
    ['typescript', 'TypeScript'],
    ['react', 'React'],
    ['tailwind css', 'Tailwind CSS'],
    ['node.js', 'Node.js'],
    ['nodejs', 'Node.js'],
    ['express.js', 'Express.js'],
    ['expressjs', 'Express.js'],
    ['mongodb', 'MongoDB'],
    ['mongoose', 'Mongoose'],
    ['rest api', 'REST API'],
    ['c', 'C'],
    ['c++', 'C++'],
    ['java', 'Java'],
    ['python', 'Python'],
    ['sql', 'SQL'],
    ['artificial intelligence', 'Artificial Intelligence'],
    ['machine learning', 'Machine Learning'],
    ['data visualization', 'Data Visualization'],
    ['data visualisation', 'Data Visualization'],
    ['pandas', 'Pandas'],
    ['numpy', 'NumPy'],
    ['scikit learn', 'Scikit-learn'],
    ['scikit-learn', 'Scikit-learn'],
    ['sklearn', 'Scikit-learn'],
    ['matplotlib', 'Matplotlib'],
    ['seaborn', 'Seaborn'],
    ['nlp', 'NLP'],
    ['data analysis', 'Data Analysis'],
    ['resume parsing', 'Resume Parsing'],
    ['job description parsing', 'Job Description Parsing'],
    ['skill extraction', 'Skill Extraction'],
    ['skill normalization', 'Skill Normalization'],
    ['skill normalisation', 'Skill Normalization'],
    ['structured skill profiling', 'Structured Skill Profiling'],
    ['prompt engineering', 'Prompt Engineering'],
    ['face recognition', 'Face Recognition'],
    ['facial recognition', 'Face Recognition'],
    ['webcam integration', 'Webcam Integration'],
    ['intruder detection', 'Intruder Detection'],
    ['flask', 'Flask'],
    ['django', 'Django'],
    ['mysql', 'MySQL'],
    ['postgresql', 'PostgreSQL'],
    ['firebase', 'Firebase'],
    ['aws', 'AWS'],
    ['git', 'Git'],
    ['github', 'GitHub'],
    ['gui', 'GUI'],
    ['email alerts', 'Email Alerts'],
    ['recommendation system', 'Recommendation System'],
    ['recommendations', 'Recommendation System'],
    ['gap analysis', 'Gap Analysis'],
    ['question generation', 'Question Generation'],
    ['difficulty adjustment', 'Difficulty Adjustment'],
    ['vs code', 'VS Code'],
    ['postman', 'Postman'],
  ]);

  const normalized = normalizeSkill(value);
  if (known.has(normalized)) return known.get(normalized);

  return normalized
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
