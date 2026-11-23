'use client';

import { GENRES } from '@/lib/story-options';
import type { Genre } from '@/types/story';

interface GenreSelectorProps {
  value: Genre | '';
  onChange: (genre: Genre | '') => void;
  disabled?: boolean;
}

export function GenreSelector({ value, onChange, disabled = false }: GenreSelectorProps) {
  return (
    <fieldset disabled={disabled} className="min-w-0">
      <legend className="mb-2 text-sm font-semibold text-stone-800">Genre</legend>
      <div className="flex flex-wrap gap-2">
        {GENRES.map((genre) => {
          const isActive = value === genre;
          return (
            <button
              key={genre}
              type="button"
              aria-pressed={isActive}
              disabled={disabled}
              onClick={() => onChange(isActive ? '' : genre)}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 disabled:cursor-not-allowed disabled:opacity-50 ${
                isActive
                  ? 'border-amber-700 bg-amber-700 text-white shadow-sm'
                  : 'border-stone-300 bg-white text-stone-700 hover:border-amber-500 hover:text-amber-800'
              }`}
            >
              {genre}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-stone-500">Optional — leave empty to let the storyteller choose.</p>
    </fieldset>
  );
}
