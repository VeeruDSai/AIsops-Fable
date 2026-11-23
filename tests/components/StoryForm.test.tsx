// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StoryForm } from '@/components/StoryForm';
import { GENRES } from '@/lib/story-options';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function textResponse(chunks: string[]): Response {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });
  return new Response(body, { status: 200 });
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('StoryForm', () => {
  it('renders all 8 genres and tracks the active chip', async () => {
    const user = userEvent.setup();
    render(<StoryForm />);

    for (const genre of GENRES) {
      expect(screen.getByRole('button', { name: genre })).toBeDefined();
    }

    const fantasy = screen.getByRole('button', { name: 'Fantasy' });
    expect(fantasy.getAttribute('aria-pressed')).toBe('false');

    await user.click(fantasy);
    expect(screen.getByRole('button', { name: 'Fantasy' }).getAttribute('aria-pressed')).toBe('true');

    await user.click(screen.getByRole('button', { name: 'Fantasy' }));
    expect(screen.getByRole('button', { name: 'Fantasy' }).getAttribute('aria-pressed')).toBe('false');
  });

  it('adds up to 5 characters and removes individual rows', async () => {
    const user = userEvent.setup();
    render(<StoryForm />);

    const rows = () => screen.getAllByRole('textbox', { name: /^Character \d+ name$/ });
    expect(rows()).toHaveLength(1);

    for (let index = 0; index < 4; index += 1) {
      await user.click(screen.getByRole('button', { name: 'Add character' }));
    }

    expect(rows()).toHaveLength(5);
    expect(screen.getByRole('button', { name: /Maximum of 5 characters/ })).toHaveProperty(
      'disabled',
      true
    );

    await user.click(screen.getByRole('button', { name: 'Remove character 1' }));
    expect(rows()).toHaveLength(4);
  });

  it('submits a StoryRequest payload and accumulates streamed text', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(textResponse(['# The ', 'Moon Fox', '\n\nThe beginning.']));
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<StoryForm />);

    await user.type(screen.getByRole('textbox', { name: /^Character 1 name$/ }), 'Mira');
    await user.type(screen.getByRole('textbox', { name: /Role or trait/i }), 'cunning fox');
    await user.click(screen.getByRole('button', { name: 'Mystery' }));
    await user.type(screen.getByLabelText(/Premise/i), 'A missing moon');
    await user.click(screen.getByRole('button', { name: 'Generate Story' }));

    expect(await screen.findByText(/Moon Fox/)).toBeDefined();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/generate');
    expect(init.method).toBe('POST');

    const payload = JSON.parse(init.body as string);
    expect(payload.genre).toBe('Mystery');
    expect(payload.premise).toBe('A missing moon');
    expect(payload.characters).toHaveLength(1);
    expect(payload.characters[0]).toMatchObject({ name: 'Mira', role: 'cunning fox' });
    expect(payload.characters[0].id).toBeTruthy();
  });

  it('locks every control while the response stream is open', async () => {
    let releaseStream: (() => void) | undefined;
    const encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        releaseStream = () => {
          controller.enqueue(encoder.encode('The end.'));
          controller.close();
        };
      },
    });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(body, { status: 200 })));
    const user = userEvent.setup();
    render(<StoryForm />);

    await user.click(screen.getByRole('button', { name: 'Generate Story' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Generate Story' })).toHaveProperty(
        'disabled',
        true
      );
    });
    expect(screen.getByRole('button', { name: 'Surprise Me' })).toHaveProperty('disabled', true);
    expect(screen.getByRole('button', { name: 'Fantasy' })).toHaveProperty('disabled', true);
    expect(screen.getByRole('textbox', { name: /^Character 1 name$/ })).toHaveProperty(
      'disabled',
      true
    );
    expect(screen.getByLabelText(/Premise/i)).toHaveProperty('disabled', true);

    await act(async () => {
      releaseStream?.();
    });

    expect(await screen.findByText('The end.')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Generate Story' })).toHaveProperty(
      'disabled',
      false
    );
  });

  it('shows a friendly alert when the API returns 429', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(429, {
          error: 'slow down',
          code: 'RATE_LIMIT_EXHAUSTED',
        })
      )
    );
    const user = userEvent.setup();
    render(<StoryForm />);

    await user.click(screen.getByRole('button', { name: 'Generate Story' }));

    expect((await screen.findByRole('alert')).textContent).toMatch(/rate limit/i);
  });

  it('shows a friendly alert when the network request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    const user = userEvent.setup();
    render(<StoryForm />);

    await user.click(screen.getByRole('button', { name: 'Generate Story' }));

    expect((await screen.findByRole('alert')).textContent).toMatch(/connection/i);
  });

  it('surprise mode posts an isSurprise-only request', async () => {
    const fetchMock = vi.fn().mockResolvedValue(textResponse(['A surprise.']));
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<StoryForm />);

    await user.click(screen.getByRole('button', { name: 'Surprise Me' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toEqual({ isSurprise: true });
    expect(await screen.findByText('A surprise.')).toBeDefined();
  });
});
