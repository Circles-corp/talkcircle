import type { JSX } from "react";
import { Link } from "react-router";
import { useGetHomeEventsQuery } from "../app/api.ts";
import { ROUTES } from "../app/routes.ts";
import { EventSection } from "../features/events/EventCard.tsx";
import {
  LiveEventCard,
  NothingLiveCard,
} from "../features/events/LiveEventCard";

function HomeSkeleton(): JSX.Element {
  return (
    <div
      role="status"
      aria-label="Loading events"
      className="flex flex-col gap-4"
    >
      <div className="h-44 rounded-card bg-surface motion-safe:animate-pulse" />
      <div className="h-24 rounded-card bg-surface motion-safe:animate-pulse" />
      <div className="h-24 rounded-card bg-surface motion-safe:animate-pulse" />
    </div>
  );
}

export default function HomePage(): JSX.Element {
  const { data, isLoading, isError, isFetching, refetch } =
    useGetHomeEventsQuery();
  const now = new Date();

  function renderContent(): JSX.Element {
    if (isLoading) {
      return <HomeSkeleton />;
    }

    if (data === undefined) {
      return (
        <div className="flex flex-col items-start gap-3 rounded-card bg-surface p-5">
          <h2 className="font-display text-lg font-bold">
            Couldn't load event
          </h2>
          <p className="text-sm text-ink-muted">
            {isError
              ? "Check your connection and try again."
              : "Something went wrong."}
          </p>
          <button
            type="button"
            disabled={isFetching}
            onClick={() => {
              void refetch();
            }}
            className="min-h-11 rounded-full bg-accent px-5 font-semibold text-on-accent disabled:opacity-60"
          >
            {isFetching ? "retrying..." : "Try again"}
          </button>
        </div>
      );
    }

    const hasAnyEvents =
      data.live.length + data.today.length + data.thisWeek.length > 0;
    if (!hasAnyEvents) {
      return (
        <div className="flex flex-col items-start gap-3 rounded-card bg-surface p-5">
          <h2 className="font-display text-lg font-bold">
            No events in your circles yet
          </h2>
          <p className="text-sm text-ink-muted">
            Join more Circles to see matches, premieres and book clubs here.
          </p>
          <Link
            to={ROUTES.explore}
            className="flex min-h-11 items-center rounded-full bg-accent px-5 font-semibold text-on-accent"
          >
            Explore circles
          </Link>
        </div>
      );
    }

    const [firstLive, ...otherLive] = data.live;
    const nextEvent = data.today[0] ?? data.thisWeek[0];

    return (
      <>
        {firstLive === undefined ? (
          <NothingLiveCard nextEvent={nextEvent} now={now} />
        ) : (
          <LiveEventCard event={firstLive} />
        )}
        <EventSection title="Also live" events={otherLive} now={now} />
        <EventSection title="Today" events={data.today} now={now} />
        <EventSection title="This week" events={data.thisWeek} now={now} />
      </>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-logo text-3xl font-bold xl:sr-only">Circle</h1>
      {renderContent()}
    </div>
  );
}
