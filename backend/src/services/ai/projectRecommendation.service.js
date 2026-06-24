import { z } from 'zod';
import { requestStructuredOutput } from './provider.js';
import { projectRecommendationSchema } from './schemas.js';

const inputSchema = z.object({
  targetRole: z.string().min(1),
  missingSkills: z.array(z.string()).default([]),
  currentSkills: z.array(z.string()).default([]),
});

function fallbackProjects({ targetRole, missingSkills }) {
  const focusSkills = missingSkills.slice(0, 3);
  return {
    projects: [
      {
        title: `${targetRole} Showcase Project`,
        summary: `Build a portfolio project that demonstrates ${focusSkills.join(', ') || 'core job readiness'}.`,
        skills: focusSkills,
        difficulty: 'Intermediate',
      },
      {
        title: `${targetRole} Reliability Sprint`,
        summary: 'Add testing, monitoring, and performance improvements to an existing application.',
        skills: ['Testing', 'Monitoring', 'Performance'],
        difficulty: 'Intermediate',
      },
    ],
  };
}

export async function recommendProjects(input) {
  const parsed = inputSchema.parse(input);
  return requestStructuredOutput({
    prompt: `Recommend portfolio projects in JSON with shape {"projects":[{"title":"","summary":"","skills":[],"difficulty":""}]} for this input: ${JSON.stringify(parsed)}`,
    schema: projectRecommendationSchema,
    fallback: async () => fallbackProjects(parsed),
  });
}
