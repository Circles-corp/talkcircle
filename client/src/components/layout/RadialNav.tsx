import { useEffect, useRef, useState, type JSX } from "react";
import { NavLink, useLocation } from "react-router";
import { X } from "lucide-react";
import { NAV_ITEMS } from "./navItems.ts";

const ARC_RADIUS = 110;
const MENU_ID = "radial-menu";

interface ArcOffset {
  x: number;
  y: number;
}

function arcOffset(index: number, count: number): ArcOffset {
  const step = count > 1 ? Math.PI / (count - 1) : 0;
  const angle = Math.PI - index * step;
  return {
    x: Math.round(Math.cos(angle) * ARC_RADIUS),
    y: Math.round(-Math.sin(angle) * ARC_RADIUS),
  };
}

export function RadialNav(): JSX.Element {
  const location = useLocation();
  const [openedOnPath, setOpenedOnPath] = useState<string | null>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const firstItemRef = useRef<HTMLAnchorElement>(null);
  const isOpen = openedOnPath === location.pathname;

  function open(): void {
    setOpenedOnPath(location.pathname);
  }

  function close(): void {
    setOpenedOnPath(null);
    toggleRef.current?.focus();
  }

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    firstItemRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setOpenedOnPath(null);
        toggleRef.current?.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="md:hidden">
      {isOpen ? (
        <>
          <div
            aria-hidden="true"
            onClick={close}
            className="fixed inset-0 z-30 bg-black/70"
          />
          <nav
            id={MENU_ID}
            aria-label="Main"
            className="fixed bottom-[calc(env(safe-area-inset-bottom)+48px)] left-1/2 z-40 size-0"
          >
            <ul>
              {NAV_ITEMS.map((item, index) => {
                const offset = arcOffset(index, NAV_ITEMS.length);
                return (
                  <li
                    key={item.to}
                    className="absolute"
                    style={{
                      transform: `translate(calc(-50% + ${offset.x}px),calc(-50% + ${offset.y}px))`,
                    }}
                  >
                    <NavLink
                      to={item.to}
                      ref={index === 0 ? firstItemRef : undefined}
                      className="flex w-18 flex-col items-center gap-1 rounded-control"
                    >
                      {({ isActive }) => (
                        <>
                          <span
                            className={
                              isActive
                                ? "flex size-13 items-center justify-center rounded-full bg-accent text-on-accent"
                                : "flex size-13 items-center justify-center rounded-full bg-canvas text-ink"
                            }
                          >
                            <item.icon
                              aria-hidden="true"
                              size={24}
                              strokeWidth={2}
                            />
                          </span>
                          <span className="text-xs font-semibold text-white">
                            {item.label}
                          </span>
                        </>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </nav>
        </>
      ) : null}
      <button
        ref={toggleRef}
        type="button"
        aria-label={isOpen ? "Close menu" : "Open menu"}
        aria-expanded={isOpen}
        aria-controls={isOpen ? MENU_ID : undefined}
        onClick={isOpen ? close : open}
        className={
          isOpen
            ? "fixed bottom-[calc(env(safe-area-inset-bottom)+16px)] left-1/2 z-50 flex size-16 -translate-x-1/2 items-center justify-center rounded-full bg-canvas text-ink"
            : "fixed bottom-[calc(env(safe-area-inset-bottom)+16px)] left-1/2 z-50 flex size-16 -translate-x-1/2 items-center justify-center rounded-full border-[5px] border-accent bg-canvas"
        }
      >
        {isOpen ? <X aria-hidden="true" size={24} strokeWidth={2} /> : null}
      </button>
    </div>
  );
}
