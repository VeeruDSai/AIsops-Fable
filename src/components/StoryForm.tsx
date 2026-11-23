'use client';

import { useState, type FormEvent } from 'react';
import { AlertCircle, Sparkles, WandSparkles } from 'lucide-react';
import { CharacterBuilder } from '@/components/CharacterBuilder';
import { GenreSelector } from '@/components/GenreSelector';
import { PremiseInput } from '@/components/PremiseInput';
import { StreamingPreview } from '@/components/StreamingPreview';
import { useStoryGeneration } from '@/hooks/useStoryGeneration';
import { createCharacter } from '@/lib/story-options';
import type { Character, Genre, StoryRequest } from '@/types/story';

export function StoryForm() {
  const [characters, setCharacters] = useState<Character[]>(() => [createCharacter()]);
  const [genre, setGenre] = useState<Genre | ''>('');
  const [premise, setPremise] = useState('');
  const { storyText, isLoading, error, generate, surpriseMe } = useStoryGeneration();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoading) {
      return;
    }

    const request: StoryRequest = {
      characters: characters.map((character) => ({
        id: character.id,
        name: character.name.trim(),
        role: (character.role ?? '').trim(),
      })),
      genre: genre || undefined,
      premise: premise.trim() || undefined,
    };

    void generate(request);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
      <form
        aria-label="Story configuration"
        onSubmit={handleSubmit}
        className="space-y-6 rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6"
      >
        <GenreSelector value={genre} onChange={setGenre} disabled={isLoading} />
        <div className="h-px bg-stone-200" />
        <CharacterBuilder characters={characters} onChange={setCharacters} disabled={isLoading} />
        <div className="h-px bg-stone-200" />
        <PremiseInput value={premise} onChange={setPremise} disabled={isLoading} />

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800"
          >
            <AlertCircle aria-hidden="true" size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-col gap-3 pt-1 sm:flex-row">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-amber-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-amber-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? <Sparkles aria-hidden="true" size={16} className="animate-pulse" /> : <Sparkles aria-hidden="true" size={16} />}
            Generate Story
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => void surpriseMe()}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-amber-700 px-4 py-2.5 text-sm font-semibold text-amber-800 transition-colors hover:bg-amber-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <WandSparkles aria-hidden="true" size={16} />
            Surprise Me
          </button>
        </div>
      </form>

      <StreamingPreview text={storyText} isLoading={isLoading} />
    </div>
  );
}
