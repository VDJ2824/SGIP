import { z } from 'zod';
import { requestStructuredOutput } from './provider.js';
import { resumeSkillExtractionSchema } from './schemas.js';

const inputSchema = z.object({
  resumeText: z.string().min(1),
});

const commonSkills = [
  'JavaScript',
  'TypeScript',
  'React',
  'Node.js',
  'Express',
  'SQL',
  'MongoDB',
  'Testing',
  'Docker',
  'AWS',
  'System Design',
  'Git',
];

function fallbackExtract(resumeText = '') {
  const lower = resumeText.toLowerCase();
  const skills = commonSkills
    .filter((skill) => lower.includes(skill.toLowerCase().replace(/\./g, '')))
    .map((skill) => ({
      name: skill,
      confidence: 75,
      category: skill === 'AWS' ? 'Cloud' : skill === 'SQL' || skill === 'MongoDB' ? 'Databases' : 'General',
      source: 'resume',
    }));

  return {
    skills,
    summary: skills.length
      ? `Detected ${skills.length} likely skills from the resume text.`
      : 'No high-confidence skills detected from the provided resume text.',
  };
}

export async function extractResumeSkills(input) {
  const parsed = inputSchema.parse(input);
  const result = await requestStructuredOutput({
    prompt: `Extract the strongest skills from the resume text and return JSON with shape {"skills":[{"name":"","confidence":0,"category":"","source":"resume"}],"summary":""}. Resume: ${parsed.resumeText}`,
    schema: resumeSkillExtractionSchema,
    fallback: async () => fallbackExtract(parsed.resumeText),
  });

  return result;
}
