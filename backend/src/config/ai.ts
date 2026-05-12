/**
 * ai.ts
 *
 * OpenRouter AI configuration.
 * All AI calls are proxied through the backend so the API key
 * is never exposed to the browser.
 */

import axios from 'axios';

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';

export const openRouterClient = axios.create({
  baseURL: OPENROUTER_BASE,
  headers: {
    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
    'X-Title': process.env.VITE_APP_NAME || 'Store',
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

export const AI_MODEL = process.env.OPENROUTER_CHAT_MODEL || 'openrouter/auto';

/**
 * Lightweight chat completion — used by shopping assistant and admin description generator.
 */
export async function chatCompletion(
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  options: { temperature?: number; max_tokens?: number } = {}
): Promise<string> {
  const { data } = await openRouterClient.post('/chat/completions', {
    model: AI_MODEL,
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.max_tokens ?? 600,
  });
  return data.choices[0]?.message?.content?.trim() || '';
}
