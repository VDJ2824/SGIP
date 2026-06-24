import { z } from 'zod';
import { requestStructuredOutput } from './provider.js';
import { jobDescriptionParsingSchema } from './schemas.js';

const inputSchema = z.object({
  jobDescription: z.string().min(1),
});

function fallbackParse(text = '') {
  const lower = text.toLowerCase();
  const requiredSkills = [];
  const preferredSkills = [];

  ['javascript', 'typescript', 'react', 'node.js', 'node', 'sql', 'mongodb', 'aws', 'docker', 'testing'].forEach((skill) => {
    if (lower.includes(skill.replace('.', ''))) {
      requiredSkills.push(skill.replace(/\b\w/g, (c) => c.toUpperCase()));
    }
  });

  if (lower.includes('preferred') || lower.includes('nice to have')) {
    preferredSkills.push('Communication', 'System Design');
  }

  return {
    title: /role[:\s-]+([^\n]+)/i.exec(text)?.[1]?.trim() || 'Parsed Role',
    companyType: lower.includes('startup') ? 'Startup' : lower.includes('product') ? 'Product' : 'General',
    level: lower.includes('senior') ? 'Senior' : lower.includes('intern') ? 'Intern' : 'Entry to Mid',
    requiredSkills,
    preferredSkills,
    responsibilities: text
      .split('\n')
      .filter((line) => /build|design|ship|maintain|develop|optimize/i.test(line))
      .slice(0, 5),
  };
}

export async function parseJobDescription(input) {
  const parsed = inputSchema.parse(input);
  return requestStructuredOutput({
    prompt: `Parse the following job description into JSON with shape {"title":"","companyType":"","level":"","requiredSkills":[],"preferredSkills":[],"responsibilities":[]}: ${parsed.jobDescription}`,
    schema: jobDescriptionParsingSchema,
    fallback: async () => fallbackParse(parsed.jobDescription),
  });
}
