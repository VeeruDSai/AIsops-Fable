export interface Character {
  id: string;
  name: string;
  role?: string;
}

export type Genre =
  | 'Fantasy'
  | 'Sci-Fi'
  | 'Horror'
  | 'Romance'
  | 'Mystery'
  | 'Adventure'
  | 'Comedy'
  | 'Thriller';

export interface StoryRequest {
  characters?: Character[];
  genre?: Genre | string;
  premise?: string;
  isSurprise?: boolean;
}

export interface ApiErrorResponse {
  error: string;
  code: 'MISSING_API_KEY' | 'RATE_LIMIT_EXHAUSTED' | 'GENERATION_ERROR';
}
