import { skipToken } from "@reduxjs/toolkit/query";
import { ArrowLeft } from "lucide-react";
import type { JSX } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { useGetCircleQuery } from "../app/api.ts";
import { ROUTES } from "../app/routes.ts";
import { memberLabel } from "../features/circles/circleFormat.ts";
import { MembershipButton } from "../features/circles/MembershipButton.tsx";
import { CATEGORY_STYLE } from "../features/events/categoryStyle.ts";

function isMissingCircle(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }
  if (!("status" in error)) {
    return false;
  }
  return error.status === 404 || error.status === 400;
}

export default function CirclePage(): JSX.Element {
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { data, error, isLoading, isFetching, refetch } = useGetCircleQuery(
    slug ?? skipToken,
  );

  function goBack(): void {
    if (location.key === "default") {
      void navigate(ROUTES.explore);
      return;
    }
    void navigate(-1);
  }

  const backButton = (
    <button
      type="button"
      onClick={goBack}
      aria-label="Back"
      className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface text-ink"
    >
      <ArrowLeft aria-hidden="true" size={20} />
    </button>
  );

  if (slug === undefined || isMissingCircle(error)) {
    return (
      <div className="flex flex-col items-start gap-4">
        {backButton}
        <h1 className="font-display text-2xl font-bold">Circle not found</h1>
        <p className="text-ink-muted">
          That circle doesn't exist, or its link is wrong.
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

  if (isLoading) {
    return (
      <div
        role="status"
        aria-label="Loading circle"
        className="flex flex-col gap-4"
      >
        <div className="h-11 w-2/3 rounded-full bg-surface motion-safe:animate-pulse" />
        <div className="h-64 rounded-card bg-surface motion-safe:animate-pulse" />
      </div>
    );
  }

  if (data === undefined) {
    return (
      <div className="flex flex-col items-start gap-3">
        {backButton}
        <div className="flex w-full flex-col items-start gap-3 rounded-card bg-surface p-5">
          <h1 className="font-display text-lg font-bold">
            Couldn't load this circle
          </h1>
          <p className="text-sm text-ink-muted">
            Check your connection and try again.
          </p>
          <button
            type="button"
            disabled={isFetching}
            onClick={() => {
              void refetch();
            }}
            className="min-h-11 rounded-full bg-accent px-5 font-semibold text-on-accent disabled:opacity-60"
          >
            {isFetching ? "Retrying..." : "Try again"}
          </button>
        </div>
      </div>
    );
  }

  const { circle } = data;
  const style = CATEGORY_STYLE[circle.category];
  const Icon = style.icon;

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center gap-3">
        {backButton}
        <span
          aria-hidden="true"
          className={`flex size-11 shrink-0 items-center justify-center rounded-tile text-ink ${style.tileClass}`}
        >
          <Icon size={20} strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-xl font-bold">
            {circle.name}
          </h1>
          <p className="text-sm text-ink-muted">
            {memberLabel(circle.memberCount)}
          </p>
        </div>
        <MembershipButton circle={circle} />
      </header>
      <p className="text-sm text-ink-muted">{circle.description}</p>
      <section
        aria-label="Pins"
        className="flex flex-col items-center gap-1 rounded-card bg-cork px-4 py-16 text-center"
      >
        <p className="font-display font-semibold">No pins here yet</p>
        <p className="text-sm text-ink-muted">
          {circle.isMember
            ? "Be the first to pin something."
            : "Join to start pinning."}
        </p>
      </section>
    </div>
  );
}
