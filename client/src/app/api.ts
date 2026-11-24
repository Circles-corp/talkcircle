import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  CircleList,
  CircleResponse,
  PublicCircle,
  setMembershipArgs,
} from "../types/circle.ts";
import type { CircleEvent, HomeEvents } from "../types/event.ts";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "/api/v1";

interface SetGoingArgs {
  id: string;
  going: boolean;
}

interface SetGoingResponse {
  event: CircleEvent;
}

function applyMembership(circle: PublicCircle, join: boolean): void {
  if (circle.isMember === join) {
    return;
  }
  circle.isMember = join;
  circle.memberCount = Math.max(0, circle.memberCount + (join ? 1 : -1));
}

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    credentials: "include",
  }),
  refetchOnReconnect: true,
  tagTypes: ["HomeEvents", "Circles"],
  endpoints: (build) => ({
    getHomeEvents: build.query<HomeEvents, void>({
      query: () => "/events/home",
      providesTags: ["HomeEvents"],
    }),
    setGoing: build.mutation<SetGoingResponse, SetGoingArgs>({
      query: ({ id, going }) => ({
        url: `/events/${encodeURIComponent(id)}/going`,
        method: going ? "POST" : "DELETE",
      }),
      async onQueryStarted({ id, going }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          api.util.updateQueryData("getHomeEvents", undefined, (draft) => {
            for (const group of [draft.live, draft.today, draft.thisWeek]) {
              for (const event of group) {
                if (event.id === id && event.isGoing !== going) {
                  event.isGoing = going;
                  event.goingCount += going ? 1 : -1;
                }
              }
            }
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
    }),
    getCircles: build.query<CircleList, void>({
      query: () => "/circles",
      providesTags: ["Circles"],
    }),
    getCircle: build.query<CircleResponse, string>({
      query: (slug) => `/circles/${encodeURIComponent(slug)}`,
      providesTags: ["Circles"],
    }),
    setMembership: build.mutation<CircleResponse, setMembershipArgs>({
      query: ({ slug, join }) => ({
        url: `/circles/${encodeURIComponent(slug)}/join`,
        method: join ? "POST" : "DELETE",
      }),
      async onQueryStarted({ slug, join }, { dispatch, queryFulfilled }) {
        const listPatch = dispatch(
          api.util.updateQueryData("getCircles", undefined, (draft) => {
            for (const circle of draft.items) {
              if (circle.slug === slug) {
                applyMembership(circle, join);
              }
            }
          }),
        );
        const circlePatch = dispatch(
          api.util.updateQueryData("getCircle", slug, (draft) => {
            applyMembership(draft.circle, join);
          }),
        );
        try {
          const { data } = await queryFulfilled;
          dispatch(
            api.util.updateQueryData("getCircles", undefined, (draft) => {
              const index = draft.items.findIndex(
                (circle) => circle.slug === slug,
              );
              if (index !== -1) {
                draft.items[index] = data.circle;
              }
            }),
          );
          dispatch(
            api.util.updateQueryData("getCircle", slug, (draft) => {
              draft.circle = data.circle;
            }),
          );
        } catch {
          listPatch.undo();
          circlePatch.undo();
        }
      },
    }),
  }),
});

export const {
  useGetHomeEventsQuery,
  useSetGoingMutation,
  useGetCirclesQuery,
  useGetCircleQuery,
  useSetMembershipMutation,
} = api;
