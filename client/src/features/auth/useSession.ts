import { useGetSessionQuery } from "../../app/api.ts";
import type { PublicUser } from "../../types/auth.ts";

export type Session =
  | { state: "loading" }
  | { state: "signedIn"; user: PublicUser }
  | { state: "signedOut" }
  | { state: "error"; retry: () => void };

export function useSession(): Session {
  const { data, isError, refetch } = useGetSessionQuery();

  if (data !== undefined) {
    if (data.user === null) {
      return { state: "signedOut" };
    }
    return { state: "signedIn", user: data.user };
  }
  if (isError) {
    return {
      state: "error",
      retry: () => {
        void refetch();
      },
    };
  }
  return { state: "loading" };
}
