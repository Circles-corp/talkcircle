import type { JSX } from "react";
import { NavLink } from "react-router";
import { NAV_ITEMS } from "./navItems.ts";

export function BottomNav(): JSX.Element {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-canvas pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="mx-auto flex max-w-xl justify-around">
        {NAV_ITEMS.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                isActive
                  ? "flex min-h-14 min-w-16 flex-col items-center justify-center gap-0.5 text-xs font-semibold text-ink"
                  : "flex min-h-14 min-w-16 flex-col items-center justify-center gap-0.5 text-xs text-ink-muted"
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    aria-hidden="true"
                    size={24}
                    strokeWidth={isActive ? 2.5 : 2}
                    className={isActive ? "text-accent" : "text-icon-muted"}
                  />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
