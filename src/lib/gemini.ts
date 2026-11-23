import { GoogleGenAI } from '@google/genai';

export const DEFAULT_STORY_MODEL = 'gemini-2.5-flash';

/**
 * Returns an initialized Google Gen AI client.
 * Strictly reads from server-side environment variables.
 */
export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not defined.');
  }
  return new GoogleGenAI({ apiKey });
}
