import { createApi, fetchBaseQuery, type BaseQueryFn } from '@reduxjs/toolkit/query/react';
import type { RootState } from './store';
import { setCredentials, signOut } from '@/features/auth/store/authSlice';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: `${API_URL}/api`,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) headers.set('authorization', `Bearer ${token}`);
    return headers;
  },
});

// Wrap baseQuery: on 401, try refresh once, retry the original request, then
// give up and sign the user out. Single-flight via a shared promise so a burst
// of 401s only fires one refresh.
let refreshInFlight: Promise<{ accessToken: string; refreshToken: string } | null> | null = null;

const baseQueryWithReauth: BaseQueryFn = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);
  if (result.error?.status === 401) {
    const state = api.getState() as RootState;
    const refreshToken = state.auth.refreshToken;
    if (refreshToken) {
      refreshInFlight ??= (async () => {
        const res = await fetch(`${API_URL}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (!res.ok) return null;
        return res.json();
      })();
      const refreshed = await refreshInFlight;
      refreshInFlight = null;
      if (refreshed?.accessToken) {
        api.dispatch(
          setCredentials({
            user: state.auth.user!,
            accessToken: refreshed.accessToken,
            refreshToken: refreshed.refreshToken,
          }),
        );
        result = await rawBaseQuery(args, api, extraOptions);
      } else {
        api.dispatch(signOut());
      }
    } else {
      api.dispatch(signOut());
    }
  }
  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Board', 'Task', 'Activity', 'Notification'],
  endpoints: () => ({}),
});
