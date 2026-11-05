import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { CircleEvent, HomeEvents } from "../types/event.ts";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "/api";

interface SetGoingArgs {
  id: string;
  going: boolean;
}

interface SetGoingResponse {
  event: CircleEvent;
}

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ baseUrl: API_BASE_URL }),
  refetchOnReconnect: true,
  tagTypes: ["HomeEvents"],
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
  }),
});
export const {useGetHomeEventsQuery, useSetGoingMutation} = api;
