import { Search } from "lucide-react";
import { useState, type JSX } from "react";
import { Link } from "react-router";
import { useGetCirclesQuery } from "../app/api.ts";
import { ROUTES } from "../app/routes.ts";
import {
  CATEGORY_LABEL,
  CATEGORY_ORDER,
} from "../features/circles/categories.ts";
import { CircleRow } from "../features/circles/CircleRow.tsx";
import type { CircleCategory } from "../types/event.ts";

type CategoryFilter = "all" | CircleCategory;

const Filters: readonly CategoryFilter[] = ["all", ...CATEGORY_ORDER];
const SKELETON_ROWS = [1, 2, 3, 4, 5, 6];

function filterLabel(filter: CategoryFilter): string {
  return filter === "all" ? "All" : CATEGORY_LABEL[filter];
}

function ExploreSkeleton(): JSX.Element {
  return (
    <div
      role="status"
      aria-label="Loading circles"
      className="flex flex-col gap-3"
    >
      {SKELETON_ROWS.map((row) => (
        <div
          key={row}
          className="h-16 rounded-tile bg-surface motion-safe:animate-pulse"
        />
      ))}
    </div>
  );
}

export default function ExplorePage(): JSX.Element {
  const { data, isLoading, isError, isFetching, refetch } =
    useGetCirclesQuery();
  const [filter, setFilter] = useState<CategoryFilter>("all");

  function renderContent(): JSX.Element {
    if (isLoading) {
      return <ExploreSkeleton />;
    }

    if (data === undefined) {
      return (
        <div className="flex flex-col items-start gap-3 rounded-card bg-surface p-5">
          <h2 className="font-dispaly text-lg font-bold">
            Couldn't load circles
          </h2>
          <p className="text-sm text-ink-muted">
            {isError
              ? "check your connection and try again."
              : "something went wrong."}
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
      );
    }

    const categories = filter === "all" ? CATEGORY_ORDER : [filter];
    const sections = categories
      .map((category) => ({
        category,
        circles: data.items.filter((circle) => circle.category === category),
      }))
      .filter((section) => section.circles.length > 0);

    if (sections.length === 0) {
      return (
        <p className="rounded-card bg-surface p-5 text-sm text-ink-muted">
          No circles here yet.
        </p>
      );
    }

    return (
      <>
        {sections.map((section) => (
          <section
            key={section.category}
            aria-labelledby={`explore-${section.category}`}
            className="flex flex-col"
          >
            <h2
              id={`explore-${section.category}`}
              className="text-xs font-bold tracking-wide text-ink-muted uppercase"
            >
              {CATEGORY_LABEL[section.category]}
            </h2>
            <ul className="divide-y divide-line">
              {section.circles.map((circle) => (
                <li key={circle.id}>
                  <CircleRow circle={circle} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold">Explore</h1>
        <Link
          to={ROUTES.search}
          aria-label="Search"
          className="flex size-11 items-center justify-center rounded-full bg-surface text-ink"
        >
          <Search aria-hidden="true" size={20} />
        </Link>
      </header>
      <div
        role="group"
        aria-label="Filter by category"
        className="flex gap-2 overflow-x-auto"
      >
        {Filters.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={filter === option}
            onClick={() => {
              setFilter(option);
            }}
            className={
              filter === option
                ? "min-h-11 shrink-0 rounded-full bg-accent px-4 text-sm font-semibold text-on-accent"
                : "min-h-11 shrink-0 rounded-full bg-surface px-4 text-sm text-ink"
            }
          >
            {filterLabel(option)}
          </button>
        ))}
      </div>
      {renderContent()}
    </div>
  );
}
