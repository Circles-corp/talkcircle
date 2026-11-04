import type { JSX } from "react";
import { Outlet, useNavigation } from "react-router";
import { RadialNav } from "./RadialNav.tsx";
import { SideNav } from "./SideNav.tsx";

export function AppLayout(): JSX.Element {
  const navigation = useNavigation();
  const isLoadingPage = navigation.state === "loading";

  return (
    <div className="min-h-dvh">
      {isLoadingPage ? (
        <div
          role="progressbar"
          aria-label="Loading page"
          className="fixed inset-x-0 top-0 z-60 h-0.5 bg-accent motion-safe:animate-pulse"
        />
      ) : null}
      <SideNav />
      <div className="md:pl-20 xl:pl-60">
        <main className="mx-auto max-w-xl px-4 pt-4 pb-32 md:pb-8">
          <Outlet />
        </main>
      </div>
      <RadialNav />
    </div>
  );
}
