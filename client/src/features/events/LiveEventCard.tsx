import type { JSX } from "react";
import type { CircleEvent } from "../../types/event.ts";
import { attendanceLabel, displayTitle, formatWhen } from "./eventFormat.ts";
import { JoinButton } from "./JoinButton.tsx";

interface LiveEventCardProps {
  event: CircleEvent;
}

export function LiveEventCard({ event }: LiveEventCardProps): JSX.Element {
  const minute = event.score === null ? null : `${String(event.score.minute)}'`;
  const details =
    minute === null
      ? attendanceLabel(event)
      : `${minute} · ${attendanceLabel(event)}`;

  return (
    <article className="flex flex-col gap-2 rounded-card bg-accent p-5 text-on-accent">
      <p className="flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
        <span aria-hidden="true" className="size-2 rounded-full bg-live" />
        Live · {event.circle.name}
      </p>
      <h2 className="font-display text-2xl leading-tight font-bold">
        {displayTitle(event)}
      </h2>
      <p className="text-sm text-on-accent/70">{details}</p>
      <div className="mt-2">
        <JoinButton event={event} variant="onAccent" />
      </div>
    </article>
  );
}

interface NothingLiveCardProps {
  nextEvent: CircleEvent | undefined;
  now: Date;
}

export function NothingLiveCard({
  nextEvent,
  now,
}: NothingLiveCardProps): JSX.Element {
  return (
    <article className="flex flex-col gap-1 rounded-card bg-surface p-5">
      <h2 className="font-display text-lg font-bold">Nothing live right now</h2>
      {nextEvent === undefined ? (
        <p className="text-sm text-ink-muted">Check back soon.</p>
      ) : (
        <p className="text-sm text-ink-muted">
          Next up: {nextEvent.title} · {formatWhen(nextEvent.startsAt, now)}
        </p>
      )}
    </article>
  );
}
