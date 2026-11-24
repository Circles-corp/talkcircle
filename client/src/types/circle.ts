import type { CircleCategory } from "./event.ts";

export interface PublicCircle {
  id: string;
  name: string;
  slug: string;
  category: CircleCategory;
  description: string;
  memberCount: number;
  isMember: boolean;
}

export interface CircleList {
  items: PublicCircle[];
}

export interface CircleResponse {
  circle: PublicCircle;
}

export interface setMembershipArgs {
  slug: string;
  join: boolean;
}
