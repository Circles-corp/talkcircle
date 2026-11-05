import type { CircleEvent } from "../../types/event.ts";

const timeFormat = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
});
const dayFormat = new Intl.DateTimeFormat(undefined, { weekday: "short" });
const countFormat = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

function isSameDay(first: Date, second: Date): boolean {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

export function formatCount(count: number): string {
  return countFormat.format(Math.max(0, count)).toLowerCase();
}

export function formatWhen(startsAt: string, now: Date): string {
  const start = new Date(startsAt);
  if (Number.isNaN(start.getTime())) {
    return "Time to be confirmed";
  }
  if (isSameDay(start, now)) {
    return timeFormat.format(start);
  }
  return `${dayFormat.format(start)} ${timeFormat.format(start)}`;
}

export function displayTitle(event: CircleEvent): string {
  if (event.score === null) {
    return event.title;
  }
  const { homeTeam, awayTeam, home, away } = event.score;
  return `${homeTeam} ${home}-${away} ${awayTeam}`;
}

export function attendanceLabel(event: CircleEvent): string {
  const count = formatCount(event.goingCount);
  if (event.status === "live") {
    return `${count} fans in the room`;
  }
  if (event.kind === "book_club") {
    return `${count} reading along`;
  }
  return `${count} going`;
}
