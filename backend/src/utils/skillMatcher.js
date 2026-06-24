import { normalizeSkillDetails } from './normalizeSkill.js';

const confidenceByType = {
  exact: 1,
  alias: 0.95,
  related: 0.75,
  parent_concept: 0.7,
  no_match: 0,
};

function describe(role, students, matchType) {
  const names = students.map((skill) => skill.canonicalName || skill.name).join(' and ');
  if (matchType === 'exact') return `${role.canonicalName} is matched exactly by ${names}.`;
  if (matchType === 'alias') return `${role.canonicalName} is matched through the equivalent skill name ${names}.`;
  if (matchType === 'related') return `${role.canonicalName} is satisfied through ${names}, which are related ${role.category.toLowerCase()} technologies.`;
  if (matchType === 'parent_concept') return `${role.canonicalName} is partially supported by ${names} through their shared parent skill concept.`;
  return `No student skill matches ${role.canonicalName}.`;
}

export function matchRoleSkillToStudentSkills(roleSkill, studentSkillProfile = []) {
  const role = normalizeSkillDetails(roleSkill?.canonicalName || roleSkill?.name || roleSkill);
  const students = studentSkillProfile.map((skill) => ({
    ...skill,
    taxonomy: normalizeSkillDetails(skill.canonicalName || skill.name),
  }));

  const exact = students.filter((skill) => skill.taxonomy.normalizedName === role.normalizedName);
  if (exact.length) {
    return {
      matched: true,
      matchType: 'exact',
      matchedStudentSkills: exact,
      confidence: confidenceByType.exact,
      explanation: describe(role, exact, 'exact'),
    };
  }

  const roleAliases = new Set(role.aliases.map((alias) => normalizeSkillDetails(alias).normalizedName));
  const alias = students.filter((skill) =>
    roleAliases.has(skill.taxonomy.normalizedName) ||
    skill.taxonomy.aliases.some((candidate) => normalizeSkillDetails(candidate).normalizedName === role.normalizedName),
  );
  if (alias.length) {
    return {
      matched: true,
      matchType: 'alias',
      matchedStudentSkills: alias,
      confidence: confidenceByType.alias,
      explanation: describe(role, alias, 'alias'),
    };
  }

  const related = students.filter((skill) =>
    role.relatedSkills.includes(skill.taxonomy.normalizedName) ||
    skill.taxonomy.relatedSkills.includes(role.normalizedName),
  );
  if (related.length) {
    return {
      matched: true,
      matchType: 'related',
      matchedStudentSkills: related,
      confidence: Math.min(1, confidenceByType.related + Math.max(0, related.length - 1) * 0.1),
      explanation: describe(role, related, 'related'),
    };
  }

  // Parent matching is intentionally directional. A concrete student skill can
  // support a broader role concept (Matplotlib -> Data Visualization), but a
  // broad student concept must not impersonate a specific tool (Data Analysis
  // -> Power BI/Tableau).
  const parent = students.filter((skill) =>
    skill.taxonomy.parentConcepts.includes(role.normalizedName),
  );
  if (parent.length) {
    return {
      matched: true,
      matchType: 'parent_concept',
      matchedStudentSkills: parent,
      confidence: Math.min(1, confidenceByType.parent_concept + Math.max(0, parent.length - 1) * 0.1),
      explanation: describe(role, parent, 'parent_concept'),
    };
  }

  return {
    matched: false,
    matchType: 'no_match',
    matchedStudentSkills: [],
    confidence: 0,
    explanation: describe(role, [], 'no_match'),
  };
}
