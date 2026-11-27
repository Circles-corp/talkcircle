import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { isAuthResponse } from "../features/auth/isAuthResponse.ts";
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  RegistrationInfo,
  SessionResponse,
} from "../types/auth.ts";
import type {
  CircleList,
  CircleResponse,
  PublicCircle,
  setMembershipArgs,
} from "../types/circle.ts";
import type { CircleEvent, HomeEvents } from "../types/event.ts";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "/api/v1";
const REQUEST_TIMEOUT_MS = 15_000;

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  credentials: "include",
  timeout: REQUEST_TIMEOUT_MS,
});

const baseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, queryApi, extraOptions) => {
  const result = await rawBaseQuery(args, queryApi, extraOptions);
  if (result.error !== undefined && result.error.status === 401) {
    void queryApi.dispatch(
      api.util.upsertQueryData("getSession", undefined, { user: null }),
    );
  }
  return result;
};
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
  baseQuery,
  refetchOnReconnect: true,
  tagTypes: ["HomeEvents", "Circles"],
  endpoints: (build) => ({
    getSession: build.query<SessionResponse, void>({
      async queryFn(_arg, _queryApi, _extraOptions, fetchWithBase) {
        const result = await fetchWithBase("/auth/me");
        if (result.error !== undefined) {
          if (result.error.status === 401) {
            return { data: { user: null } };
          }
          return { error: result.error };
        }
        if (!isAuthResponse(result.data)) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: "The session response was not in the expected shape.",
            },
          };
        }
        return { data: { user: result.data.user } };
      },
    }),
    getRegistrationInfo: build.query<RegistrationInfo, void>({
      query: () => "/auth/registration",
    }),
    register: build.mutation<AuthResponse, RegisterRequest>({
      query: (body) => ({ url: "/auth/register", method: "POST", body }),
      invalidatesTags: ["Circles", "HomeEvents"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          void dispatch(
            api.util.upsertQueryData("getSession", undefined, data),
          );
        } catch {
          return;
        }
      },
    }),
    login: build.mutation<AuthResponse, LoginRequest>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
      invalidatesTags: ["Circles", "HomeEvents"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          void dispatch(
            api.util.upsertQueryData("getSession", undefined, data),
          );
        } catch {
          return;
        }
      },
    }),
    logout: build.mutation<null, void>({
      query: () => ({ url: "/auth/logout", method: "POST" }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch {
          return;
        }
        dispatch(api.util.resetApiState());
        void dispatch(
          api.util.upsertQueryData("getSession", undefined, { user: null }),
        );
      },
    }),

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
  useGetSessionQuery,
  useGetRegistrationInfoQuery,
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useGetHomeEventsQuery,
  useSetGoingMutation,
  useGetCirclesQuery,
  useGetCircleQuery,
  useSetMembershipMutation,
} = api;
