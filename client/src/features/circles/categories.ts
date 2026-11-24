import type { CircleCategory } from "../../types/event.ts";

export const CATEGORY_ORDER: readonly CircleCategory[] = [
  "football",
  "movies",
  "books",
];

export const CATEGORY_LABEL: Record<CircleCategory, string> = {
  football: "Football",
  movies: "Movies",
  books: "Books",
};
