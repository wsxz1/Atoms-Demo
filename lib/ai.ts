import { createOpenAI } from '@ai-sdk/openai';

const apiKey = process.env.DEEPSEEK_API_KEY ?? '';
const baseURL = process.env.DEEPSEEK_BASE_URL ?? 'https://api.deepseek.com';

export const DEFAULT_MODEL = process.env.DEEPSEEK_MODEL ?? 'deepseek-chat';

export const deepseek = createOpenAI({
  apiKey,
  baseURL,
  compatibility: 'compatible',
});

export function getModel(name?: string) {
  return deepseek(name || DEFAULT_MODEL);
}

export function hasApiKey(): boolean {
  return Boolean(apiKey && apiKey.startsWith('sk-') && apiKey.length > 20);
}
