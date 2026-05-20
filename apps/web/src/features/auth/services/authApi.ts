import type { AuthResponse, LoginInput, RegisterInput } from '@ai-task/shared';
import { baseApi } from '@/store/baseApi';

// RTK Query endpoints for auth. Each endpoint is a thin call; the slice's
// reauth wrapper handles refresh transparently for *protected* routes.
export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    register: build.mutation<AuthResponse, RegisterInput>({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
    }),
    login: build.mutation<AuthResponse, LoginInput>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),
  }),
});

export const { useRegisterMutation, useLoginMutation } = authApi;
