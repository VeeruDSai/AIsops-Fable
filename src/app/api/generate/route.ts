import { NextRequest, NextResponse } from 'next/server';
import {
  FALLBACK_MODEL_CHAIN,
  getFriendlyGeminiError,
  getGeminiClient,
  parseGeminiError,
  type GeminiErrorInfo,
} from '@/lib/gemini';
import { buildStoryPrompt, STORY_SYSTEM_INSTRUCTION } from '@/lib/prompts';
import type { StoryRequest, ApiErrorResponse } from '@/types/story';

// Ensure standard Node.js runtime for @google/genai compatibility (avoids Vercel Edge isolates)
export const runtime = 'nodejs';

// Disable response caching to allow real-time streaming
export const dynamic = 'force-dynamic';

// Allow sufficient function duration on Vercel for streaming completion
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  // 1. Verify API Key is present in server environment
  if (!process.env.GEMINI_API_KEY) {
    const errorBody: ApiErrorResponse = {
      error: 'Server environment missing GEMINI_API_KEY. Please set it in .env.local',
      code: 'MISSING_API_KEY',
    };
    return NextResponse.json(errorBody, { status: 500 });
  }

  // 2. Parse request body safely
  const body: StoryRequest = await req.json().catch(() => ({}));
  const prompt = buildStoryPrompt(body);

  // 3. Bind client disconnect to an AbortController to prevent zombie token burn
  const abortController = new AbortController();
  req.signal.addEventListener('abort', () => {
    abortController.abort();
  });

  // 4. Pre-stream Gemini API call with automatic model fallback
  let responseStream;
  let lastErrorInfo: GeminiErrorInfo | null = null;
  const ai = getGeminiClient();

  for (const model of FALLBACK_MODEL_CHAIN) {
    try {
      responseStream = await ai.models.generateContentStream({
        model,
        contents: prompt,
        config: {
          systemInstruction: STORY_SYSTEM_INSTRUCTION,
          abortSignal: abortController.signal,
        },
      });
      break;
    } catch (err: unknown) {
      const info = parseGeminiError(err);
      lastErrorInfo = info;
      if (info.kind === 'rate-limit' || !info.retryable) {
        const friendly = getFriendlyGeminiError(info);
        const errorBody: ApiErrorResponse = {
          error: friendly.message,
          code: friendly.code,
        };
        return NextResponse.json(errorBody, { status: friendly.status });
      }
    }
  }

  if (!responseStream) {
    const friendly = getFriendlyGeminiError(
      lastErrorInfo ?? { status: 503, kind: 'unavailable', retryable: true }
    );
    const errorBody: ApiErrorResponse = {
      error: friendly.message,
      code: friendly.code,
    };
    return NextResponse.json(errorBody, { status: 503 });
  }

  // 5. Construct native Web ReadableStream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of responseStream) {
          if (abortController.signal.aborted) {
            break;
          }

          // Check for safety finish reason
          const candidate = chunk.candidates?.[0];
          if (candidate?.finishReason === 'SAFETY') {
            controller.enqueue(
              encoder.encode('\n\n*[The storyteller paused this tale due to sensitive themes.]*')
            );
            break;
          }

          if (chunk.text) {
            controller.enqueue(encoder.encode(chunk.text));
          }
        }
      } catch (streamErr: unknown) {
        const streamErrMsg = String(streamErr || '');
        if (
          streamErrMsg.includes('429') ||
          streamErrMsg.includes('RESOURCE_EXHAUSTED')
        ) {
          controller.enqueue(
            encoder.encode(
              '\n\n*[The storyteller is catching its breath! Gemini rate limit reached. Please wait a moment.]*'
            )
          );
        }
      } finally {
        controller.close();
      }
    },
    cancel() {
      abortController.abort();
    },
  });

  // 6. Return streaming response with required anti-buffering headers
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
      'Transfer-Encoding': 'chunked',
    },
  });
}
