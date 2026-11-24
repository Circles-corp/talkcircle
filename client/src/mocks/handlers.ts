import { delay, http, HttpResponse } from "msw";
import type { PublicCircle } from "../types/circle.ts";
import type { CircleEvent, HomeEvents } from "../types/event.ts";
import { createMockCircles } from "./data/circles.ts";
import { createMockEvents } from "./data/events.ts";

const API = "/api/v1";
const DAY_MS = 86_400_000;
const CIRCLE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const events: CircleEvent[] = createMockEvents(new Date());
const circles: PublicCircle[] = createMockCircles();

interface EventParams {
  id: string;
}

interface CircleParams {
  slug: string;
}

function errorResponse(
  status: number,
  code: string,
  message: string,
): Response {
  return HttpResponse.json({ error: { code, message } }, { status });
}

function sortCircles(list: readonly PublicCircle[]): PublicCircle[] {
  return [...list].sort((first, second) => {
    const byCategory = first.category.localeCompare(second.category);
    if (byCategory !== 0) {
      return byCategory;
    }
    return first.name.localeCompare(second.name);
  });
}

function findCircleIndex(slug: string): number {
  return circles.findIndex((circle) => circle.slug === slug);
}

async function getCircle(slug: string): Promise<Response> {
  await delay(300);
  if (!CIRCLE_SLUG_PATTERN.test(slug)) {
    return errorResponse(400, "BAD_REQUEST", "That circle link is not valid.");
  }
  const circle = circles[findCircleIndex(slug)];
  if (circle === undefined) {
    return errorResponse(404, "CIRCLE_NOT_FOUND", "Circle not found.");
  }
  return HttpResponse.json({ circle });
}

async function setMembership(slug: string, join: boolean): Promise<Response> {
  await delay(400);
  if (!CIRCLE_SLUG_PATTERN.test(slug)) {
    return errorResponse(400, "BAD_REQUEST", "That circle link is not valid.");
  }
  const index = findCircleIndex(slug);
  const current = circles[index];
  if (current === undefined) {
    return errorResponse(404, "CIRCLE_NOT_FOUND", "Circle not found.");
  }
  if (current.isMember !== join) {
    circles[index] = {
      ...current,
      isMember: join,
      memberCount: Math.max(0, current.memberCount + (join ? 1 : -1)),
    };
  }
  return HttpResponse.json({ circle: circles[index] });
}

function isSameDay(first: Date, second: Date): boolean {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

function groupForHome(
  allEvents: readonly CircleEvent[],
  now: Date,
): HomeEvents {
  const weekEnd = now.getTime() + 7 * DAY_MS;
  const upcoming = allEvents
    .filter((event) => event.status === "upcoming")
    .sort(
      (first, second) =>
        Date.parse(first.startsAt) - Date.parse(second.startsAt),
    );

  return {
    live: allEvents.filter((event) => event.status === "live"),
    today: upcoming.filter((event) => isSameDay(new Date(event.startsAt), now)),
    thisWeek: upcoming.filter((event) => {
      const startsAt = new Date(event.startsAt);
      return !isSameDay(startsAt, now) && startsAt.getTime() <= weekEnd;
    }),
  };
}

async function setGoing(id: string, going: boolean): Promise<Response> {
  await delay(300);
  const index = events.findIndex((event) => event.id === id);
  const current = events[index];

  if (current === undefined) {
    return HttpResponse.json(
      { error: { code: "NOT_FOUND", message: "That event doesn't exist." } },
      { status: 404 },
    );
  }

  if (current.isGoing !== going) {
    events[index] = {
      ...current,
      isGoing: going,
      goingCount: current.goingCount + (going ? 1 : -1),
    };
  }

  return HttpResponse.json({ event: events[index] });
}

export const handlers = [
  http.get(`${API}/events/home`, async () => {
    await delay(400);
    return HttpResponse.json(groupForHome(events, new Date()));
  }),
  http.post<EventParams>(`${API}/events/:id/going`, ({ params }) =>
    setGoing(params.id, true),
  ),
  http.delete<EventParams>(`${API}/events/:id/going`, ({ params }) =>
    setGoing(params.id, false),
  ),
  http.get(`${API}/circles`, async () => {
    await delay(400);
    return HttpResponse.json({ items: sortCircles(circles) });
  }),
  http.get<CircleParams>(`${API}/circles/:slug`, ({ params }) =>
    getCircle(params.slug),
  ),
  http.post<CircleParams>(`${API}/circles/:slug/join`, ({ params }) =>
    setMembership(params.slug, true),
  ),
  http.delete<CircleParams>(`${API}/circles/:slug/join`, ({ params }) =>
    setMembership(params.slug, false),
  ),
];
