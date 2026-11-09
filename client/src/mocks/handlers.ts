import { delay, http, HttpResponse } from "msw";
import type { CircleEvent, HomeEvents } from "../types/event.ts";
import { createMockEvents } from "./data/events.ts";

const DAY_MS = 86_400_000;
const events: CircleEvent[] = createMockEvents(new Date());

interface EventParams {
  id: string;
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
  http.get("/api/events/home", async () => {
    await delay(400);
    return HttpResponse.json(groupForHome(events, new Date()));
  }),
  http.post<EventParams>("/api/events/:id/going", ({ params }) =>
    setGoing(params.id, true),
  ),
  http.delete<EventParams>("/api/events/:id/going", ({ params }) =>
    setGoing(params.id, false),
  ),
];
