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

  it('shows no character counter and hides the add button at 5 characters', async () => {
    const user = userEvent.setup();
    render(<StoryForm />);

    const rows = () => screen.getAllByRole('textbox', { name: /^Character \d+ name$/ });
    expect(rows()).toHaveLength(1);
    expect(screen.queryByText('1 / 5')).toBeNull();
    expect(screen.getByRole('button', { name: 'Add character' })).toBeDefined();

    for (let index = 0; index < 4; index += 1) {
      await user.click(screen.getByRole('button', { name: 'Add character' }));
    }

    expect(rows()).toHaveLength(5);
    expect(screen.queryByText('5 / 5')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Add character' })).toBeNull();
    expect(screen.queryByRole('button', { name: /Maximum of 5 characters/ })).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Remove character 1' }));
    expect(rows()).toHaveLength(4);
    expect(screen.getByRole('button', { name: 'Add character' })).toBeDefined();
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

  it('clears manual inputs when Surprise Me is clicked', async () => {
    const fetchMock = vi.fn().mockResolvedValue(textResponse(['A surprise.']));
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<StoryForm />);

    await user.type(screen.getByRole('textbox', { name: /^Character 1 name$/ }), 'Mira');
    await user.click(screen.getByRole('button', { name: 'Add character' }));
    await user.type(screen.getByRole('textbox', { name: /^Character 2 name$/ }), 'Corin');
    await user.click(screen.getByRole('button', { name: 'Mystery' }));
    await user.type(screen.getByLabelText(/Premise/i), 'A missing moon');
    await user.click(screen.getByRole('button', { name: 'Surprise Me' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toEqual({ isSurprise: true });

    const nameInput = screen.getByRole('textbox', { name: /^Character 1 name$/ }) as HTMLInputElement;
    expect(nameInput.value).toBe('');
    expect(screen.getAllByRole('textbox', { name: /^Character \d+ name$/ })).toHaveLength(1);
    expect(screen.getByLabelText(/Premise/i)).toHaveProperty('value', '');
    expect(screen.getByRole('button', { name: 'Mystery' }).getAttribute('aria-pressed')).toBe(
      'false'
    );
    expect(await screen.findByText('A surprise.')).toBeDefined();
  });

  it('regenerates with the exact configuration of the last submission', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(textResponse(['# The Moon Fox']))
      .mockResolvedValueOnce(textResponse(['# The Moon Fox Returns']));
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<StoryForm />);

    const regenerate = () => screen.getByRole('button', { name: 'Regenerate' });
    expect(regenerate()).toHaveProperty('disabled', true);

    await user.type(screen.getByRole('textbox', { name: /^Character 1 name$/ }), 'Mira');
    await user.click(screen.getByRole('button', { name: 'Mystery' }));
    await user.type(screen.getByLabelText(/Premise/i), 'A missing moon');
    await user.click(screen.getByRole('button', { name: 'Generate Story' }));

    expect(await screen.findByText(/The Moon Fox/)).toBeDefined();
    await waitFor(() => expect(regenerate()).toHaveProperty('disabled', false));

    await user.click(regenerate());

    expect(await screen.findByText(/The Moon Fox Returns/)).toBeDefined();
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const firstPayload = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    const secondPayload = JSON.parse(fetchMock.mock.calls[1][1].body as string);
    expect(secondPayload).toEqual(firstPayload);
    expect(secondPayload.genre).toBe('Mystery');
    expect(secondPayload.premise).toBe('A missing moon');
  });

  it('regenerates a Surprise Me story without reverting to form inputs', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(textResponse(['A surprise.']))
      .mockResolvedValueOnce(textResponse(['Another surprise.']));
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<StoryForm />);

    await user.type(screen.getByRole('textbox', { name: /^Character 1 name$/ }), 'Mira');
    await user.click(screen.getByRole('button', { name: 'Surprise Me' }));
    expect(await screen.findByText('A surprise.')).toBeDefined();

    await user.click(screen.getByRole('button', { name: 'Regenerate' }));

    expect(await screen.findByText('Another surprise.')).toBeDefined();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(JSON.parse(fetchMock.mock.calls[1][1].body as string)).toEqual({ isSurprise: true });
  });

  it('resets the form fields and the story canvas', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(textResponse(['# The Moon Fox'])));
    const user = userEvent.setup();
    render(<StoryForm />);

    const nameInput = () =>
      screen.getByRole('textbox', { name: /^Character 1 name$/ }) as HTMLInputElement;
    const premiseInput = () => screen.getByLabelText(/Premise/i) as HTMLTextAreaElement;

    await user.type(nameInput(), 'Mira');
    await user.click(screen.getByRole('button', { name: 'Mystery' }));
    await user.type(premiseInput(), 'A missing moon');
    await user.click(screen.getByRole('button', { name: 'Generate Story' }));
    expect(await screen.findByText(/The Moon Fox/)).toBeDefined();

    await user.click(screen.getByRole('button', { name: 'Reset' }));

    expect(nameInput().value).toBe('');
    expect(premiseInput().value).toBe('');
    expect(screen.getByRole('button', { name: 'Mystery' }).getAttribute('aria-pressed')).toBe(
      'false'
    );
    expect(
      screen.getByText('Your fable will appear here as it is written.')
    ).toBeDefined();
    expect(screen.queryByText(/The Moon Fox/)).toBeNull();
    expect(screen.getByRole('button', { name: 'Regenerate' })).toHaveProperty('disabled', true);
  });
});
