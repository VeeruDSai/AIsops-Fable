'use client';

import { PREMISE_LIMIT } from '@/lib/story-options';

interface PremiseInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function PremiseInput({ value, onChange, disabled = false }: PremiseInputProps) {
  return (
    <div className="min-w-0">
      <label htmlFor="premise" className="mb-2 block text-sm font-semibold text-stone-800">
        Premise <span className="font-normal text-stone-500">(optional)</span>
      </label>
      <textarea
        id="premise"
        rows={4}
        value={value}
        maxLength={PREMISE_LIMIT}
        disabled={disabled}
        placeholder="A lighthouse keeper discovers a map that redraws itself every midnight…"
        onChange={(event) => onChange(event.target.value)}
        className="w-full resize-y rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm leading-relaxed text-stone-900 placeholder:text-stone-400 focus:border-amber-600 focus:outline-none disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-500"
      />
      <p className="mt-1 text-right text-xs text-stone-500">
        {value.length} / {PREMISE_LIMIT}
      </p>
    </div>
  );
}
