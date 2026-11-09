export type CircleCategory = "movies" | "books" | "football";
export type EventKind = "match" | "premiere" | "book_club" | "watch_party";
export type EventStatus = "upcoming" | "live" | "ended";

export interface CircleSummary {
  slug: string;
  name: string;
  category: CircleCategory;
}

export interface LiveScore {
  homeTeam: string;
  awayTeam: string;
  home: number;
  away: number;
  minute: number;
}

export interface CircleEvent {
  id: string;
  title: string;
  kind: EventKind;
  status: EventStatus;
  startsAt: string;
  circle: CircleSummary;
  score: LiveScore | null;
  goingCount: number;
  isGoing: boolean;
}

export interface HomeEvents {
  live: CircleEvent[];
  today: CircleEvent[];
  thisWeek: CircleEvent[];
}
