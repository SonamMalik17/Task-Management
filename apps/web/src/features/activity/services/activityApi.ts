import type { ActivityLog } from '@ai-task/shared';
import { baseApi } from '@/store/baseApi';

export const activityApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listActivity: build.query<ActivityLog[], { boardId: string; limit?: number }>({
      query: ({ boardId, limit = 50 }) => `/activity/board/${boardId}?limit=${limit}`,
      providesTags: (_r, _e, { boardId }) => [{ type: 'Activity', id: boardId }],
    }),
  }),
});

export const { useListActivityQuery } = activityApi;
