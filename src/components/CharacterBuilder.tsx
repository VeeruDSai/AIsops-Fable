'use client';

import { Plus, Trash2 } from 'lucide-react';
import { createCharacter, MAX_CHARACTERS, NAME_LIMIT, ROLE_LIMIT } from '@/lib/story-options';
import type { Character } from '@/types/story';

interface CharacterBuilderProps {
  characters: Character[];
  onChange: (characters: Character[]) => void;
  disabled?: boolean;
}

export function CharacterBuilder({ characters, onChange, disabled = false }: CharacterBuilderProps) {
  const atCapacity = characters.length >= MAX_CHARACTERS;

  const updateCharacter = (id: string, field: 'name' | 'role', value: string) => {
    onChange(
      characters.map((character) =>
        character.id === id ? { ...character, [field]: value } : character
      )
    );
  };

  const removeCharacter = (id: string) => {
    onChange(characters.filter((character) => character.id !== id));
  };

  const addCharacter = () => {
    if (atCapacity || disabled) {
      return;
    }
    onChange([...characters, createCharacter()]);
  };

  return (
    <section className="min-w-0">
      <div className="mb-2">
        <h2 className="text-sm font-semibold text-stone-800">Characters</h2>
      </div>

      <div className="space-y-3">
        {characters.map((character, index) => (
          <div
            key={character.id}
            className="grid grid-cols-1 gap-2 rounded-lg border border-stone-200 bg-stone-50/60 p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
          >
            <label className="block min-w-0">
              <span className="mb-1 block text-xs font-medium text-stone-600">
                Character {index + 1} name
              </span>
              <input
                type="text"
                value={character.name}
                maxLength={NAME_LIMIT}
                disabled={disabled}
                placeholder="e.g. Mira the Fox"
                onChange={(event) => updateCharacter(character.id, 'name', event.target.value)}
                className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-600 focus:outline-none disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-500"
              />
            </label>

            <label className="block min-w-0">
              <span className="mb-1 block text-xs font-medium text-stone-600">
                Role or trait <span className="font-normal">(optional)</span>
              </span>
              <input
                type="text"
                value={character.role ?? ''}
                maxLength={ROLE_LIMIT}
                disabled={disabled}
                placeholder="e.g. cunning cartographer"
                onChange={(event) => updateCharacter(character.id, 'role', event.target.value)}
                className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-600 focus:outline-none disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-500"
              />
            </label>

            <button
              type="button"
              disabled={disabled}
              aria-label={`Remove character ${index + 1}`}
              onClick={() => removeCharacter(character.id)}
              className="inline-flex h-10 w-10 items-center justify-center justify-self-start rounded-md border border-stone-300 bg-white text-stone-500 transition-colors hover:border-red-400 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 disabled:cursor-not-allowed disabled:opacity-50 sm:justify-self-auto"
            >
              <Trash2 aria-hidden="true" size={18} />
            </button>
          </div>
        ))}
      </div>

      {!atCapacity && (
        <button
          type="button"
          disabled={disabled}
          onClick={addCharacter}
          className="mt-3 inline-flex items-center gap-2 rounded-md border border-dashed border-amber-600 px-3 py-2 text-sm font-medium text-amber-800 transition-colors hover:bg-amber-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 disabled:cursor-not-allowed disabled:border-stone-300 disabled:text-stone-400 disabled:hover:bg-transparent"
        >
          <Plus aria-hidden="true" size={16} />
          Add character
        </button>
      )}
    </section>
  );
}
