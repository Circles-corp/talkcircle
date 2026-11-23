export const CIRCLE_CATEGORIES = ["movies", "books", "football"] as const;

export type CircleCategory = (typeof CIRCLE_CATEGORIES)[number];

export const CIRCLE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const CIRCLE_NAME_MAX = 50;
export const CIRCLE_SLUG_MAX = 50;
export const CIRCLE_DESCRIPTION_MAX = 300;

export interface CircleSeed {
  name: string;
  slug: string;
  category: CircleCategory;
  description: string;
}

export interface SeedResult {
  created: number;
  existing: number;
}
