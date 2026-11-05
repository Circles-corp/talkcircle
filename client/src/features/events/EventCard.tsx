import type { JSX } from "react";
import type { CircleEvent } from "../../types/event.ts";
import { CATEGORY_STYLE } from "./categoryStyle.ts";
import { attendanceLabel, displayTitle, formatWhen } from "./eventFormat.ts";
import { JoinButton } from "./JoinButton.tsx";

interface EventCardProps {
  event: CircleEvent;
  now: Date;
}

export function EventCard({ event, now }: EventCardProps): JSX.Element {
  const style = CATEGORY_STYLE[event.circle.category];
  const Icon = style.icon;

  return (
    <article className="flex items-center gap-3 rounded-card bg-surface p-3">
      <div
        className={`flex size-16 shrink-0 items-center justify-center rounded-title text-ink ${style.tileClass}`}
      >
        <Icon aria-hidden="true" size={26} strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium tracking-wide text-ink-muted uppercase">
          {formatWhen(event.startsAt, now)} . {event.circle.name}
        </p>
        <h3 className="line-clamp-2 font-display font-semibold leading-snug">
          {displayTitle(event)}
        </h3>
        <p className="text-sm text-ink-muted">{attendanceLabel(event)}</p>
      </div>
      <JoinButton event={event} variant="outline" />
    </article>
  );
}

interface EventSectionProps {
  title: string;
  events: readonly CircleEvent[];
  now: Date;
}

export function EventSection({
  title,
  events,
  now,
}: EventSectionProps): JSX.Element | null {
  if (events.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-lg font-bold">{title}</h2>
      <ul className="flex flex-col gap-3">
        {events.map((event) => (
          <li key={event.id}>
            <EventCard event={event} now={now} />
          </li>
        ))}
      </ul>
    </section>
  );
}
