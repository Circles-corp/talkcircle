import { useState, type JSX } from "react";
import { useSetMembershipMutation } from "../../app/api.ts";
import type { PublicCircle } from "../../types/circle.ts";

interface MembershipButtonProps {
  circle: PublicCircle;
}

export function MembershipButton({
  circle,
}: MembershipButtonProps): JSX.Element {
  const [setMembership, { isLoading }] = useSetMembershipMutation();
  const [hasError, setHasError] = useState(false);

  async function toggleMembership(): Promise<void> {
    setHasError(false);
    try {
      await setMembership({
        slug: circle.slug,
        join: !circle.isMember,
      }).unwrap();
    } catch {
      setHasError(true);
    }
  }

  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <button
        type="button"
        disabled={isLoading}
        onClick={() => {
          void toggleMembership();
        }}
        className={
          circle.isMember
            ? "min-h-11 min-w-20 rounded-full border border-line bg-canvas px-4 text-sm font-semibold text-ink disabled:opacity-60"
            : "min-h-11 min-w-20 rounded-full bg-accent px-4 text-sm font-semibold text-on-accent disabled:opacity-60"
        }
      >
        {circle.isMember ? "Joined" : "Join"}
      </button>
      {hasError ? (
        <p role="alert" className="text-xs text-danger">
          Couldn't update. Try again.
        </p>
      ) : null}
    </div>
  );
}
