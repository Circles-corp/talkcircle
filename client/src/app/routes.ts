export const ROUTES = {
  landing: "/",
  home: "/home",
  explore: "/explore",
  create: "/create",
  chats: "/chats",
  profile: "/profile",
  userProfile: "/u/:username",
  search: "/search",
  circle: "/c/:slug",
} as const;

export function circlePath(slug: string): string {
  return `/c/${encodeURIComponent(slug)}`;
}
