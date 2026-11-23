import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/generate/route';
import { DEFAULT_STORY_MODEL } from '@/lib/gemini';
import { buildStoryPrompt, STORY_SYSTEM_INSTRUCTION } from '@/lib/prompts';
import { GoogleGenAI } from '@google/genai';

const { mockGenerateContentStream } = vi.hoisted(() => ({
  mockGenerateContentStream: vi.fn(),
}));

// Mock the @google/genai SDK
vi.mock('@google/genai', () => {
  const MockGoogleGenAI = vi.fn().mockImplementation(() => ({
    models: {
      generateContentStream: mockGenerateContentStream,
    },
  }));
  return {
    GoogleGenAI: MockGoogleGenAI,
  };
});

describe('POST /api/generate Route Handler', () => {
  const originalEnv = process.env;

  const makeGoogleError = (status: number, reason: string) => ({
    message: `${status} ${reason}`,
    status,
    code: status,
    error: {
      code: status,
      status: reason,
      errors: [{ message: `${status} ${reason}`, reason }],
    },
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockGenerateContentStream.mockReset();
    process.env = { ...originalEnv };
  });

  it('returns 500 MISSING_API_KEY when GEMINI_API_KEY is not defined', async () => {
    delete process.env.GEMINI_API_KEY;

    const req = new NextRequest('http://localhost:3000/api/generate', {
      method: 'POST',
      body: JSON.stringify({ premise: 'Once upon a time' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(500);

    const data = await res.json();
    expect(data.code).toBe('MISSING_API_KEY');
    expect(data.error).toContain('missing GEMINI_API_KEY');
  });

  it('executes Gemini streaming and includes anti-buffering headers', async () => {
    process.env.GEMINI_API_KEY = 'test-api-key';

    // Mock async iterator generator yielding chunks
    async function* mockStream() {
      yield { text: 'Once ' };
      yield { text: 'upon ' };
      yield { text: 'a time.' };
    }

    const ai = new (GoogleGenAI as unknown as { new (): any })();
    ai.models.generateContentStream.mockResolvedValue(mockStream());

    const req = new NextRequest('http://localhost:3000/api/generate', {
      method: 'POST',
      body: JSON.stringify({ premise: 'A tale of an owl' }),
    });

    const res = await POST(req);

    expect(ai.models.generateContentStream).toHaveBeenCalledWith({
      model: DEFAULT_STORY_MODEL,
      contents: buildStoryPrompt({ premise: 'A tale of an owl' }),
      config: expect.objectContaining({
        systemInstruction: STORY_SYSTEM_INSTRUCTION,
        abortSignal: expect.any(AbortSignal),
      }),
    });

    // Verify status & anti-buffering headers
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/plain');
    expect(res.headers.get('X-Accel-Buffering')).toBe('no');
    expect(res.headers.get('Cache-Control')).toBe('no-cache, no-transform');
    expect(res.headers.get('Transfer-Encoding')).toBe('chunked');

    // Read full stream text
    const text = await res.text();
    expect(text).toBe('Once upon a time.');
  });

  it('passes full story requests through the narrative prompt engine', async () => {
    process.env.GEMINI_API_KEY = 'test-api-key';

    async function* mockStream() {
      yield { text: '# The Lantern Keeper' };
    }

    const ai = new (GoogleGenAI as unknown as { new (): any })();
    ai.models.generateContentStream.mockResolvedValue(mockStream());

    const body = {
      characters: [{ id: '1', name: 'Mira', role: 'a lamp keeper' }],
      genre: 'Mystery',
      premise: 'A lantern goes out at the same hour every night.',
    };

    const req = new NextRequest('http://localhost:3000/api/generate', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const res = await POST(req);

    expect(ai.models.generateContentStream).toHaveBeenCalledWith(
      expect.objectContaining({
        contents: buildStoryPrompt(body),
        config: expect.objectContaining({
          systemInstruction: STORY_SYSTEM_INSTRUCTION,
        }),
      })
    );
    expect(await res.text()).toBe('# The Lantern Keeper');
  });

  it('handles 429 rate limit before stream initiation', async () => {
    process.env.GEMINI_API_KEY = 'test-api-key';

    const ai = new (GoogleGenAI as unknown as { new (): any })();
    const rateLimitError = new Error('RESOURCE_EXHAUSTED: Rate limit exceeded');
    (rateLimitError as any).status = 429;
    ai.models.generateContentStream.mockRejectedValue(rateLimitError);

    const req = new NextRequest('http://localhost:3000/api/generate', {
      method: 'POST',
      body: JSON.stringify({ premise: 'Test' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(429);

    const data = await res.json();
    expect(data.code).toBe('RATE_LIMIT_EXHAUSTED');
    expect(data.error).toContain('taking a breath');
  });

  it('aborts upstream generation when client aborts request', async () => {
    process.env.GEMINI_API_KEY = 'test-api-key';

    const abortController = new AbortController();
    const ai = new (GoogleGenAI as unknown as { new (): any })();

    async function* slowStream() {
      yield { text: 'Chapter 1' };
    }
    ai.models.generateContentStream.mockImplementation(({ config }: any) => {
      expect(config.abortSignal).toBeDefined();
      return Promise.resolve(slowStream());
    });

    const req = new NextRequest('http://localhost:3000/api/generate', {
      method: 'POST',
      signal: abortController.signal,
      body: JSON.stringify({ premise: 'Test' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    // Trigger client abort
    abortController.abort();
  });

  it('handles mid-stream safety block with an in-band notice', async () => {
    process.env.GEMINI_API_KEY = 'test-api-key';

    async function* safetyStream() {
      yield { text: 'In a dark wood, ' };
      yield { candidates: [{ finishReason: 'SAFETY' }] };
      yield { text: 'this text should never be reached' };
    }

    const ai = new (GoogleGenAI as unknown as { new (): any })();
    ai.models.generateContentStream.mockResolvedValue(safetyStream());

    const req = new NextRequest('http://localhost:3000/api/generate', {
      method: 'POST',
      body: JSON.stringify({ premise: 'Spooky story' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const text = await res.text();
    expect(text).toContain('In a dark wood, ');
    expect(text).toContain('paused this tale due to sensitive themes');
    expect(text).not.toContain('this text should never be reached');
  });

  it('handles mid-stream 429 quota exhaustion with an in-band notice', async () => {
    process.env.GEMINI_API_KEY = 'test-api-key';

    async function* quotaExhaustedStream() {
      yield { text: 'Beginning of the adventure...' };
      throw new Error('429 RESOURCE_EXHAUSTED: quota reached');
    }

    const ai = new (GoogleGenAI as unknown as { new (): any })();
    ai.models.generateContentStream.mockResolvedValue(quotaExhaustedStream());

    const req = new NextRequest('http://localhost:3000/api/generate', {
      method: 'POST',
      body: JSON.stringify({ premise: 'Long adventure' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const text = await res.text();
    expect(text).toContain('Beginning of the adventure...');
    expect(text).toContain('catching its breath! Gemini rate limit reached');
  });

  it('falls back to gemini-3.8-flash-lite after a pre-stream 503', async () => {
    process.env.GEMINI_API_KEY = 'test-api-key';

    async function* recoveredStream() {
      yield { text: 'A fallback tale.' };
    }

    mockGenerateContentStream
      .mockRejectedValueOnce(makeGoogleError(503, 'UNAVAILABLE'))
      .mockResolvedValueOnce(recoveredStream());

    const req = new NextRequest('http://localhost:3000/api/generate', {
      method: 'POST',
      body: JSON.stringify({ premise: 'A patient fox' }),
    });

    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(await res.text()).toBe('A fallback tale.');
    expect(mockGenerateContentStream).toHaveBeenCalledTimes(2);
    expect(mockGenerateContentStream.mock.calls[0]?.[0].model).toBe('gemini-3.8-flash');
    expect(mockGenerateContentStream.mock.calls[1]?.[0].model).toBe('gemini-3.8-flash-lite');
  });

  it('retries the next model after a pre-stream 404', async () => {
    process.env.GEMINI_API_KEY = 'test-api-key';

    async function* recoveredStream() {
      yield { text: 'A provisioned tale.' };
    }

    mockGenerateContentStream
      .mockRejectedValueOnce(makeGoogleError(404, 'NOT_FOUND'))
      .mockResolvedValueOnce(recoveredStream());

    const req = new NextRequest('http://localhost:3000/api/generate', {
      method: 'POST',
      body: JSON.stringify({ premise: 'A careful owl' }),
    });

    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(await res.text()).toBe('A provisioned tale.');
    expect(mockGenerateContentStream).toHaveBeenCalledTimes(2);
    expect(mockGenerateContentStream.mock.calls[1]?.[0].model).toBe('gemini-3.8-flash-lite');
  });

  it('returns a clean 503 message when every model fails with 503', async () => {
    process.env.GEMINI_API_KEY = 'test-api-key';

    mockGenerateContentStream
      .mockRejectedValueOnce(makeGoogleError(503, 'UNAVAILABLE'))
      .mockRejectedValueOnce(makeGoogleError(503, 'UNAVAILABLE'))
      .mockRejectedValueOnce(makeGoogleError(503, 'UNAVAILABLE'));

    const req = new NextRequest('http://localhost:3000/api/generate', {
      method: 'POST',
      body: JSON.stringify({ premise: 'A stubborn badger' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(503);

    const data = await res.json();
    expect(data.code).toBe('GENERATION_ERROR');
    expect(data.error).toBe(
      'The storyteller is swamped by high demand right now. Please try again in a moment.'
    );
    expect(mockGenerateContentStream).toHaveBeenCalledTimes(3);
    expect(mockGenerateContentStream.mock.calls.map((call) => call[0].model)).toEqual([
      'gemini-3.8-flash',
      'gemini-3.8-flash-lite',
      'gemini-2.5-flash-lite',
    ]);
  });

  it('stops the fallback chain on 429 with a friendly rate-limit response', async () => {
    process.env.GEMINI_API_KEY = 'test-api-key';

    mockGenerateContentStream
      .mockRejectedValueOnce(makeGoogleError(503, 'UNAVAILABLE'))
      .mockRejectedValueOnce(makeGoogleError(429, 'RESOURCE_EXHAUSTED'));

    const req = new NextRequest('http://localhost:3000/api/generate', {
      method: 'POST',
      body: JSON.stringify({ premise: 'A tired hare' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(429);

    const data = await res.json();
    expect(data.code).toBe('RATE_LIMIT_EXHAUSTED');
    expect(data.error).toContain('taking a breath');
    expect(mockGenerateContentStream).toHaveBeenCalledTimes(2);
  });
});
