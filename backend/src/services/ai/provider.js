import { aiConfig } from './config.js';

function extractJson(text = '') {
  const match = String(text).match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error('AI provider did not return valid JSON');
  }
  return JSON.parse(match[0]);
}

async function fetchWithTimeout(url, options = {}, timeoutMs = aiConfig.timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(new Error('AI request timed out')), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`AI provider request failed with ${response.status}`);
    }
    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function callOpenAI({ prompt, model, apiKey, timeoutMs = aiConfig.timeoutMs }) {
  const payload = {
    model,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: 'Return only valid JSON that matches the requested schema.' },
      { role: 'user', content: prompt },
    ],
  };

  const response = await fetchWithTimeout(
    'https://api.openai.com/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
    timeoutMs,
  );

  return extractJson(response.choices?.[0]?.message?.content || '{}');
}

async function callGemini({ prompt, model, apiKey, timeoutMs = aiConfig.timeoutMs }) {
  const response = await fetchWithTimeout(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
        },
      }),
    },
    timeoutMs,
  );

  const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  return extractJson(text);
}

export async function requestStructuredOutput({
  provider = aiConfig.provider,
  prompt,
  schema,
  fallback,
  timeoutMs = aiConfig.timeoutMs,
}) {
  const maxedPrompt = String(prompt).slice(0, aiConfig.maxInputChars);

  try {
    let raw;
    if (provider === 'openai' && aiConfig.openai.apiKey) {
      raw = await callOpenAI({ prompt: maxedPrompt, model: aiConfig.openai.model, apiKey: aiConfig.openai.apiKey, timeoutMs });
    } else if (provider === 'gemini' && aiConfig.gemini.apiKey) {
      raw = await callGemini({ prompt: maxedPrompt, model: aiConfig.gemini.model, apiKey: aiConfig.gemini.apiKey, timeoutMs });
    } else {
      raw = fallback ? await fallback() : {};
    }

    return schema.parse(raw);
  } catch (error) {
    if (!fallback) throw error;
    return schema.parse(await fallback());
  }
}
