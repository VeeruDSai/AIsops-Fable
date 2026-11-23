import { GoogleGenAI } from '@google/genai';
import type { ApiErrorResponse } from '@/types/story';

export const FALLBACK_MODEL_CHAIN = [
  'gemini-3.8-flash',
  'gemini-3.8-flash-lite',
  'gemini-2.5-flash-lite',
] as const;

export const DEFAULT_STORY_MODEL: string = FALLBACK_MODEL_CHAIN[0];

export interface GeminiErrorInfo {
  status: number | null;
  kind: 'rate-limit' | 'unavailable' | 'not-found' | 'unknown';
  retryable: boolean;
}

interface GeminiErrorLike {
  status?: unknown;
  code?: unknown;
  message?: unknown;
  error?: {
    status?: unknown;
    code?: unknown;
    message?: unknown;
    errors?: Array<{
      status?: unknown;
      code?: unknown;
      message?: unknown;
      reason?: unknown;
    }>;
  };
  errors?: Array<{
    status?: unknown;
    code?: unknown;
    message?: unknown;
    reason?: unknown;
  }>;
}

export function parseGeminiError(err: unknown): GeminiErrorInfo {
  const error = (err ?? {}) as GeminiErrorLike;
  const firstNestedError = error.error?.errors?.[0] ?? error.errors?.[0];
  const numericCandidates = [
    error.status,
    error.code,
    error.error?.status,
    error.error?.code,
    firstNestedError?.code,
    firstNestedError?.status,
  ];

  let status: number | null = null;
  for (const candidate of numericCandidates) {
    const value = typeof candidate === 'string' || typeof candidate === 'number' ? Number(candidate) : NaN;
    if (value === 404 || value === 429 || value === 503) {
      status = value;
      break;
    }
  }

  const text = [error.message, error.error?.message, firstNestedError?.message, firstNestedError?.reason]
    .filter((value): value is string => typeof value === 'string')
    .join(' ')
    .toUpperCase();

  if (status === 429 || /429|RESOURCE_EXHAUSTED/.test(text)) {
    return { status: 429, kind: 'rate-limit', retryable: false };
  }
  if (status === 503 || /503|UNAVAILABLE/.test(text)) {
    return { status: 503, kind: 'unavailable', retryable: true };
  }
  if (status === 404 || /404|NOT_FOUND/.test(text)) {
    return { status: 404, kind: 'not-found', retryable: true };
  }
  return { status, kind: 'unknown', retryable: false };
}

export function getFriendlyGeminiError(info: GeminiErrorInfo): {
  status: number;
  code: ApiErrorResponse['code'];
  message: string;
} {
  if (info.kind === 'rate-limit') {
    return {
      status: 429,
      code: 'RATE_LIMIT_EXHAUSTED',
      message:
        'The storyteller is taking a breath! Gemini free-tier rate limit reached. Please wait a few seconds and try again.',
    };
  }
  if (info.kind === 'unavailable' || info.kind === 'not-found') {
    return {
      status: 503,
      code: 'GENERATION_ERROR',
      message: 'The storyteller is swamped by high demand right now. Please try again in a moment.',
    };
  }
  return {
    status: 500,
    code: 'GENERATION_ERROR',
    message: 'Story generation failed. Please try again.',
  };
}

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
