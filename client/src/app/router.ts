import type { ComponentType } from "react";
import { createBrowserRouter } from "react-router";
import { AppLayout } from "../components/layout/AppLayout.tsx";
import { PageLoading } from "../components/layout/PageLoading.tsx";
import { RouteErrorPage } from "../pages/RouteErrorPage.tsx";
import { ROUTES } from "./routes.ts";

interface PageModule {
  default: ComponentType;
}

async function loadPage(
  importPage: () => Promise<PageModule>,
): Promise<{ Component: ComponentType }> {
  const pageModule = await importPage();
  return { Component: pageModule.default };
}

export const router = createBrowserRouter([
  {
    ErrorBoundary: RouteErrorPage,
    HydrateFallback: PageLoading,
    children: [
      {
        path: ROUTES.landing,
        lazy: () => loadPage(() => import("../pages/LandingPage.tsx")),
      },
      {
        Component: AppLayout,
        children: [
          {
            path: ROUTES.home,
            lazy: () => loadPage(() => import("../pages/HomePage.tsx")),
          },
          {
            path: ROUTES.explore,
            lazy: () => loadPage(() => import("../pages/ExplorePage.tsx")),
          },
          {
            path: ROUTES.create,
            lazy: () => loadPage(() => import("../pages/CreatePostPage.tsx")),
          },
          {
            path: ROUTES.chats,
            lazy: () => loadPage(() => import("../pages/ChatsPage.tsx")),
          },
          {
            path: ROUTES.profile,
            lazy: () => loadPage(() => import("../pages/MyProfilePage.tsx")),
          },
          {
            path: ROUTES.userProfile,
            lazy: () => loadPage(() => import("../pages/ProfilePage.tsx")),
          },
          {
            path: ROUTES.search,
            lazy: () => loadPage(() => import("../pages/SearchPage.tsx")),
          },
        ],
      },
      {
        path: "*",
        lazy: () => loadPage(() => import("../pages/NotFoundPage.tsx")),
      },
    ],
  },
]);
