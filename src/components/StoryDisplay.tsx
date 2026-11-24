'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Check, Copy, LoaderCircle, Printer, RefreshCw } from 'lucide-react';

interface StoryDisplayProps {
  text: string;
  isLoading: boolean;
  error?: string | null;
  onRegenerate?: () => void;
}

const COPIED_RESET_MS = 2000;

export function StoryDisplay({
  text,
  isLoading,
  error = null,
  onRegenerate,
}: StoryDisplayProps) {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasStory = text.trim().length > 0;

  useEffect(() => {
    return () => {
      if (resetTimer.current) {
        clearTimeout(resetTimer.current);
      }
    };
  }, []);

  // A new generation clears the story; drop any stale "Copied!" confirmation with it.
  useEffect(() => {
    if (!hasStory) {
      setCopied(false);
    }
  }, [hasStory]);

  const handleCopy = useCallback(async () => {
    if (!text.trim()) {
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (resetTimer.current) {
        clearTimeout(resetTimer.current);
      }
      resetTimer.current = setTimeout(() => setCopied(false), COPIED_RESET_MS);
    } catch {
      setCopied(false);
    }
  }, [text]);

  return (
    <section
      aria-label="Story reader"
      className="story-reader min-w-0 rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6"
    >
      <div data-print-hide className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-700">
            Your Story
          </h2>
          {isLoading && (
            <span className="inline-flex items-center gap-1.5 text-xs text-amber-800">
              <LoaderCircle aria-hidden="true" size={14} className="animate-spin" />
              Writing…
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onRegenerate}
            disabled={!hasStory || isLoading}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-stone-300 px-4 py-2.5 text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw aria-hidden="true" size={16} />
            Regenerate
          </button>
          <button
            type="button"
            onClick={() => void handleCopy()}
            disabled={!hasStory}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-amber-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-amber-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {copied ? (
              <Check aria-hidden="true" size={16} />
            ) : (
              <Copy aria-hidden="true" size={16} />
            )}
            {copied ? 'Copied!' : 'Copy Story'}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            disabled={!hasStory}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-amber-700 px-4 py-2.5 text-sm font-semibold text-amber-800 transition-colors hover:bg-amber-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Printer aria-hidden="true" size={16} />
            Print / Save PDF
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          data-print-hide
          className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800"
        >
          {error}
        </div>
      )}

      {hasStory ? (
        <div
          aria-live="polite"
          aria-atomic="false"
          className="story-prose prose prose-stone max-w-[65ch] break-words font-serif"
        >
          <ReactMarkdown>{text}</ReactMarkdown>
        </div>
      ) : (
        !error && (
          <p className="font-serif text-sm italic leading-relaxed text-stone-500">
            Your tale will appear here as it is written.
          </p>
        )
      )}
    </section>
  );
}
