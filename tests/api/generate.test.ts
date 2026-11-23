import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/generate/route';
import { GoogleGenAI } from '@google/genai';

// Mock the @google/genai SDK
vi.mock('@google/genai', () => {
  const mockGenerateContentStream = vi.fn();
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

  beforeEach(() => {
    vi.clearAllMocks();
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
});
