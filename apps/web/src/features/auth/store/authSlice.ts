import type { User } from '@ai-task/shared';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

// Auth state is persisted to localStorage so refreshing the page doesn't sign
// the user out. Tokens go in localStorage (not cookies) because the API uses
// bearer-token auth — there's no SSR session story to support here.
const STORAGE_KEY = 'ai-task-auth';

interface AuthState {
  user: Omit<User, 'createdAt' | 'updatedAt'> | null;
  accessToken: string | null;
  refreshToken: string | null;
}

function loadPersisted(): AuthState {
  if (typeof window === 'undefined') return { user: null, accessToken: null, refreshToken: null };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { user: null, accessToken: null, refreshToken: null };
    return JSON.parse(raw);
  } catch {
    return { user: null, accessToken: null, refreshToken: null };
  }
}

const authSlice = createSlice({
  name: 'auth',
  initialState: loadPersisted(),
  reducers: {
    setCredentials: (state, action: PayloadAction<AuthState>) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      }
    },
    signOut: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    },
  },
});

export const { setCredentials, signOut } = authSlice.actions;
export const authReducer = authSlice.reducer;
