import { z } from 'zod';
import { requestStructuredOutput } from './provider.js';
import { roadmapGenerationSchema } from './schemas.js';

const inputSchema = z.object({
  targetRole: z.string().min(1),
  currentSkills: z.array(z.string()).default([]),
  missingSkills: z.array(z.string()).default([]),
  durationWeeks: z.number().int().positive().default(8),
});

function fallbackRoadmap({ targetRole, missingSkills, durationWeeks }) {
  const weeks = Math.max(4, durationWeeks);
  const milestoneCount = Math.max(3, Math.min(6, Math.ceil(weeks / 2)));
  const milestones = Array.from({ length: milestoneCount }).map((_, index) => ({
    title: `Milestone ${index + 1}`,
    dueDate: '',
    tasks: [
      {
        title: missingSkills[index] ? `Build proof for ${missingSkills[index]}` : 'Ship a portfolio improvement',
        description: `Advance readiness for ${targetRole}.`,
        dueDate: '',
        skills: missingSkills.slice(index, index + 2),
        priority: index === 0 ? 'High' : 'Medium',
      },
    ],
  }));

  return {
    title: `${targetRole} readiness roadmap`,
    overview: `A ${weeks}-week roadmap focused on closing the key gaps for ${targetRole}.`,
    milestones,
  };
}

export async function generateRoadmap(input) {
  const parsed = inputSchema.parse(input);
  return requestStructuredOutput({
    prompt: `Create a roadmap JSON with shape {"title":"","overview":"","milestones":[{"title":"","dueDate":"","tasks":[{"title":"","description":"","dueDate":"","skills":[],"priority":""}]}]} for this input: ${JSON.stringify(parsed)}`,
    schema: roadmapGenerationSchema,
    fallback: async () => fallbackRoadmap(parsed),
  });
}
