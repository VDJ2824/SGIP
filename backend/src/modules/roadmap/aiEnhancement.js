import { z } from 'zod';
import { requestStructuredOutput } from '../../services/ai/provider.js';

const enhancementSchema = z.object({
  motivationalExplanation: z.string().max(600).default(''),
  sequencingAdvice: z.array(z.string().max(180)).max(5).default([]),
  studyTips: z.array(z.string().max(180)).max(8).default([]),
  extraResources: z.array(z.string().max(180)).max(8).default([]),
});

export async function enhanceRoadmap({ targetRole, phases }) {
  const immutableOutline = phases.map((phase) => ({
    phaseNumber: phase.phaseNumber,
    title: phase.title,
    tasks: phase.tasks.map((task) => task.title),
  }));

  const prompt = `You enhance an existing deterministic learning roadmap.
You MUST NOT add, remove, rename, reprioritize, or reorder tasks or skills.
You MUST NOT modify readiness scores, durations, phases, or priorities.
Return JSON only with:
{"motivationalExplanation":"","sequencingAdvice":[],"studyTips":[],"extraResources":[]}

Target role: ${targetRole}
Immutable roadmap outline: ${JSON.stringify(immutableOutline)}

Provide concise study tips, sequencing advice, motivation, and optional resources only.`;

  const result = await requestStructuredOutput({
    prompt,
    schema: enhancementSchema,
    fallback: async () => ({
      motivationalExplanation: '',
      sequencingAdvice: [],
      studyTips: [],
      extraResources: [],
    }),
  });

  return {
    used: Boolean(
      result.motivationalExplanation ||
      result.sequencingAdvice.length ||
      result.studyTips.length ||
      result.extraResources.length
    ),
    generatedAt: new Date(),
    ...result,
  };
}
