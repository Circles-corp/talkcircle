import type { JSX } from "react";
import { Link } from "react-router";
import { circlePath } from "../../app/routes.ts";
import type { PublicCircle } from "../../types/circle.ts";
import { CATEGORY_STYLE } from "../events/categoryStyle.ts";
import { memberLabel } from "./circleFormat.ts";
import { MembershipButton } from "./MembershipButton.tsx";

interface CircleRowProps {
  circle: PublicCircle;
}

export function CircleRow({ circle }: CircleRowProps): JSX.Element {
  const style = CATEGORY_STYLE[circle.category];
  const Icon = style.icon;

  return (
    <article className="flex items-center gap-3 py-3">
      <Link
        to={circlePath(circle.slug)}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-tile"
      >
        <span
          aria-hidden="true"
          className={`flex size-12 shrink-0 items-center justify-center rounded-tile text-ink ${style.tileClass}`}
        >
          <Icon size={22} strokeWidth={1.75} />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate font-display font-semibold">
            {circle.name}
          </span>
          <span className="truncate text-sm text-ink-muted">
            {memberLabel(circle.memberCount)} · {circle.description}
          </span>
        </span>
      </Link>
      <MembershipButton circle={circle} />
    </article>
  );
}
