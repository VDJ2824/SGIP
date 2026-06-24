import { env } from '../../config/index.js';

export const aiConfig = {
  provider: env.AI_PROVIDER || 'fallback',
  timeoutMs: env.AI_TIMEOUT_MS || 10000,
  maxInputChars: env.AI_MAX_INPUT_CHARS || 20000,
  openai: {
    apiKey: env.OPENAI_API_KEY || '',
    model: env.AI_OPENAI_MODEL || 'gpt-4o-mini',
  },
  gemini: {
    apiKey: env.GEMINI_API_KEY || '',
    model: env.AI_GEMINI_MODEL || 'gemini-1.5-flash',
  },
};
