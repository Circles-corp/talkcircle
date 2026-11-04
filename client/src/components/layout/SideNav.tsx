import type { JSX } from "react";
import { NavLink } from "react-router";
import { NAV_ITEMS } from "./navItems.ts";

export function SideNav(): JSX.Element {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-y-0 left-0 z-20 hidden w-20 flex-col border-r border-line bg-canvas py-6 md:flex xl:w-60 xl:px-4"
    >
      <div className="mb-6 flex justify-center xl:justify-start xl:px-3">
        <span
          aria-hidden="true"
          className="size-9 rounded-full border-4 border-accent xl:hidden"
        />
        <span className="hidden font-logo text-3xl font-bold xl:inline">
          Circle
        </span>
      </div>
      <ul className="flex flex-col items-center gap-1 xl:items-stretch">
        {NAV_ITEMS.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              aria-label={item.label}
              className={({ isActive }) =>
                isActive
                  ? "flex min-h-12 min-w-12 items-center justify-center gap-4 rounded-full px-3 font-semibold text-ink xl:justify-start"
                  : "flex min-h-12 min-w-12 items-center justify-center gap-4 rounded-full px-3 text-ink-muted hover:bg-surface xl:justify-start"
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
                  <span className="hidden xl:inline">{item.label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
