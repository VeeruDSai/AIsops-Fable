'use client';

import { useCallback, useRef, useState } from 'react';
import type { StoryRequest } from '@/types/story';

const RATE_LIMIT_MESSAGE =
  'Rate limit reached — the storyteller needs a short breather. Please wait a moment and try again.';
const CONNECTION_MESSAGE =
  'Could not reach the storyteller. Check your connection and try again.';

class FriendlyError extends Error {}

export interface StoryGenerationState {
  storyText: string;
  isLoading: boolean;
  error: string | null;
  generate: (request: StoryRequest) => Promise<void>;
  surpriseMe: () => Promise<void>;
  regenerate: () => Promise<void>;
  reset: () => void;
  abort: () => void;
}

export function useStoryGeneration(): StoryGenerationState {
  const [storyText, setStoryText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const lastRequestRef = useRef<StoryRequest | null>(null);

  const run = useCallback(async (request: StoryRequest) => {
    if (controllerRef.current) {
      return;
    }

    lastRequestRef.current = request;
    const controller = new AbortController();
    controllerRef.current = controller;
    setStoryText('');
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      if (!response.ok) {
        let code: string | undefined;
        let serverMessage: string | undefined;
        try {
          const body = (await response.json()) as { error?: string; code?: string };
          code = body.code;
          serverMessage = body.error;
        } catch {}

        if (response.status === 429 || code === 'RATE_LIMIT_EXHAUSTED') {
          throw new FriendlyError(RATE_LIMIT_MESSAGE);
        }
        throw new FriendlyError(serverMessage || CONNECTION_MESSAGE);
      }

      if (!response.body) {
        throw new FriendlyError(CONNECTION_MESSAGE);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      for (;;) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        const chunk = decoder.decode(value, { stream: true });
        if (chunk) {
          setStoryText((current) => current + chunk);
        }
      }

      const remainder = decoder.decode();
      if (remainder) {
        setStoryText((current) => current + remainder);
      }
    } catch (cause) {
      if (!controller.signal.aborted) {
        setError(cause instanceof FriendlyError ? cause.message : CONNECTION_MESSAGE);
      }
    } finally {
      controllerRef.current = null;
      setIsLoading(false);
    }
  }, []);

  const generate = useCallback(
    (request: StoryRequest) => run(request),
    [run]
  );

  const surpriseMe = useCallback(() => run({ isSurprise: true }), [run]);

  // Replays the exact last request (form configuration or Surprise Me mode).
  const regenerate = useCallback(() => {
    const lastRequest = lastRequestRef.current;
    return lastRequest ? run(lastRequest) : Promise.resolve();
  }, [run]);

  const reset = useCallback(() => {
    lastRequestRef.current = null;
    setStoryText('');
    setError(null);
  }, []);

  const abort = useCallback(() => controllerRef.current?.abort(), []);

  return { storyText, isLoading, error, generate, surpriseMe, regenerate, reset, abort };
}
