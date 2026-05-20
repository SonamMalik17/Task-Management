import type { Notification } from '@ai-task/shared';
import { baseApi } from '@/store/baseApi';

export const notificationApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listNotifications: build.query<Notification[], { unreadOnly?: boolean } | void>({
      query: (args) => `/notifications?unreadOnly=${args?.unreadOnly ? 'true' : 'false'}`,
      providesTags: ['Notification'],
    }),
    markRead: build.mutation<Notification, string>({
      query: (id) => ({ url: `/notifications/${id}/read`, method: 'POST' }),
      invalidatesTags: ['Notification'],
    }),
    markAllRead: build.mutation<void, void>({
      query: () => ({ url: '/notifications/read-all', method: 'POST' }),
      invalidatesTags: ['Notification'],
    }),
  }),
});

export const { useListNotificationsQuery, useMarkReadMutation, useMarkAllReadMutation } =
  notificationApi;
