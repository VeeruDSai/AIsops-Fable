import type { Character, Genre } from '@/types/story';

export const GENRES: readonly Genre[] = [
  'Fantasy',
  'Sci-Fi',
  'Horror',
  'Romance',
  'Mystery',
  'Adventure',
  'Comedy',
  'Thriller',
];

export const MAX_CHARACTERS = 5;
export const NAME_LIMIT = 50;
export const ROLE_LIMIT = 100;
export const PREMISE_LIMIT = 500;

let fallbackId = 0;

export function createCharacter(): Character {
  const id =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `character-${(fallbackId += 1)}`;
  return { id, name: '', role: '' };
}
