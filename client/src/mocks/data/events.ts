import type { CircleEvent } from "../../types/event.ts";

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

function shiftFrom(now: Date, milliseconds: number): string {
    return new Date(now.getTime() + milliseconds).toISOString();
}

export function createMockEvents(now: Date): CircleEvent[] {
    return [
        {
            id: "evt-npfl-enyimba-rangers",
            title: "Enyimba vs Rangers",
            kind: "match",
            status: "live",
            startsAt: shiftFrom(now, -67 * MINUTE_MS),
            circle: {slug: "npfl", name: "NPFL", category: "football" },
            score: { homeTeam: "Enyimba", awayTeam: "Rangers", home:1, away: 0,  minute: 67 },
            goingCount: 342,
            isGoing: false,
        },
        {
            id: "evt-nollywood-watch-oarty",
            title: "Third Mainland watch party",
            kind: "watch_party",
            status: "upcoming",
            startsAt: shiftFrom(now, 3 * HOUR_MS,),
            circle: {slug: "nollywood", name: "Nollywood", category: "movies"},
            score: null,
            goingCount: 120,
            isGoing: false,
        },
        {
            id: "evt-aflit-book-club",
            title: "Book club: Purple Hibiscus, ch. 5-8",
            kind: "book_club",
            status: "upcoming",
            startsAt: shiftFrom(now, 2 * DAY_MS),
            circle: {slug: "african-literature", name: "African Literature", category: "books" },
            score: null,
            goingCount: 38,
            isGoing: false,
        },
        {
            id: "evt-epl-derby",
            title: "Derby day watch-along",
            kind: "watch_party",
            status: "upcoming",
            startsAt:shiftFrom(now, 4 * DAY_MS),
            circle: {slug: "premier-league", name: "Premier League", category: "football" },
            score: null,
            goingCount: 1240,
            isGoing: false,
        },
        {
            id: "evt-marvel-ended",
            title: "Marvel marathon night",
            kind: "watch_party",
            status: "ended",
            startsAt: shiftFrom(now, -1 * DAY_MS),
            circle: {slug: "marvel-dc", name: "Marvel & DC", category: "movies" },
            score: null,
            goingCount: 877,
            isGoing: false,

        },
    ];
}