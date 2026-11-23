'use client';

import { LoaderCircle } from 'lucide-react';

interface StreamingPreviewProps {
  text: string;
  isLoading: boolean;
}

export function StreamingPreview({ text, isLoading }: StreamingPreviewProps) {
  return (
    <section
      aria-label="Story preview"
      className="min-w-0 rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-700">
          Story preview
        </h2>
        {isLoading && (
          <span className="inline-flex items-center gap-1.5 text-xs text-amber-800">
            <LoaderCircle aria-hidden="true" size={14} className="animate-spin" />
            Writing…
          </span>
        )}
      </div>

      {text ? (
        <div
          aria-live="polite"
          aria-atomic="false"
          className="whitespace-pre-wrap break-words font-serif text-[15px] leading-relaxed text-stone-800"
        >
          {text}
        </div>
      ) : (
        <p className="font-serif text-sm italic leading-relaxed text-stone-400">
          Your tale will appear here as it is written.
        </p>
      )}
    </section>
  );
}
