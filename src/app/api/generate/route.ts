import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient, DEFAULT_STORY_MODEL } from '@/lib/gemini';
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

  // 4. Pre-stream Gemini API call with rate-limit and error trapping
  let responseStream;
  try {
    const ai = getGeminiClient();
    responseStream = await ai.models.generateContentStream({
      model: DEFAULT_STORY_MODEL,
      contents: prompt,
      config: {
        systemInstruction: STORY_SYSTEM_INSTRUCTION,
        abortSignal: abortController.signal,
      },
    });
  } catch (err: unknown) {
    const errObj = err as { status?: number; message?: string };
    const errMessage = String(errObj?.message || err || '');
    const isRateLimit =
      errObj?.status === 429 ||
      errMessage.includes('429') ||
      errMessage.includes('RESOURCE_EXHAUSTED');

    if (isRateLimit) {
      const errorBody: ApiErrorResponse = {
        error:
          'The storyteller is taking a breath! Gemini free-tier rate limit reached. Please wait a few seconds and try again.',
        code: 'RATE_LIMIT_EXHAUSTED',
      };
      return NextResponse.json(errorBody, { status: 429 });
    }

    const errorBody: ApiErrorResponse = {
      error: errObj?.message || 'Story generation failed',
      code: 'GENERATION_ERROR',
    };
    return NextResponse.json(errorBody, { status: 500 });
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
