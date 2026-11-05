import { useState, type JSX } from "react";
import { useSetGoingMutation } from "../../app/api.ts";
import type { CircleEvent } from "../../types/event.ts";

type JoinButtonVariant = "onAccent" | "outline";

interface JoinButtonProps {
  event: CircleEvent;
  variant: JoinButtonVariant;
}

function buttonLabel(event: CircleEvent): string {
  if (event.status === "live") {
    return event.isGoing ? "You're in" : "Join the room";
  }
  return event.isGoing ? "Going" : "Join";
}

function buttonClass(variant: JoinButtonVariant, isGoing: boolean): string {
  if (variant === "onAccent") {
    return isGoing
      ? "min-h-11 rounded-full px-5 font-semibold text-on-accent ring-1 ring-on-accent disabled:opacity-60"
      : "min-h-11 rounded-full bg-canvas px-5 font-semibold text-ink disabled:opacity-60";
  }
  return isGoing
    ? "min-h-11 min-w-20 rounded-full bg-accent px-4 text-sm font-semibold text-on-accent disabled:opacity-60"
    : "min-h-11 min-w-20 rounded-full border border-icon-muted px-4 text-sm font-semibold text-ink disabled:opacity-60";
}

export function JoinButton({ event, variant }: JoinButtonProps): JSX.Element {
  const [setGoing, { isLoading }] = useSetGoingMutation();
  const [hasError, setHasError] = useState(false);

  async function toggleGoing(): Promise<void> {
    setHasError(false);
    try {
      await setGoing({ id: event.id, going: !event.isGoing }).unwrap();
    } catch {
      setHasError(true);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        aria-pressed={event.isGoing}
        disabled={isLoading}
        onClick={() => {
          void toggleGoing();
        }}
        className={buttonClass(variant, event.isGoing)}
      >
        {buttonLabel(event)}
      </button>
      {hasError ? (
        <p role="alert" className={variant === "onAccent" ? "text-xs text-on-accent" : "text-xs text-danger"}>
          Couldn't update. Try again.
        </p>
      ) : null}
    </div>
  );
}