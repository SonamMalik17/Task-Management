import type {
  CreateTaskInput,
  MoveTaskInput,
  Task,
  UpdateTaskInput,
} from '@ai-task/shared';
import { baseApi } from '@/store/baseApi';

export const taskApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    createTask: build.mutation<Task, CreateTaskInput>({
      query: (body) => ({ url: '/tasks', method: 'POST', body }),
      invalidatesTags: (_r, _e, arg) => [{ type: 'Task', id: `LIST-${arg.boardId}` }],
    }),
    updateTask: build.mutation<Task, { id: string; patch: UpdateTaskInput; boardId: string }>({
      query: ({ id, patch }) => ({ url: `/tasks/${id}`, method: 'PATCH', body: patch }),
      invalidatesTags: (_r, _e, { boardId }) => [{ type: 'Task', id: `LIST-${boardId}` }],
    }),
    moveTask: build.mutation<Task, { id: string; input: MoveTaskInput; boardId: string }>({
      // Optimistic update — Kanban drag should feel instant. If the server
      // rejects, the next refetch corrects state.
      onQueryStarted: async ({ id, input, boardId }, { dispatch, queryFulfilled }) => {
        const patch = dispatch(
          baseApi.util.updateQueryData('getBoard' as never, boardId as never, (draft: any) => {
            const t = draft.tasks.find((x: Task) => x.id === id);
            if (t) {
              t.status = input.status;
              t.position = input.position;
            }
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
      query: ({ id, input }) => ({ url: `/tasks/${id}/move`, method: 'POST', body: input }),
    }),
    deleteTask: build.mutation<void, { id: string; boardId: string }>({
      query: ({ id }) => ({ url: `/tasks/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, { boardId }) => [{ type: 'Task', id: `LIST-${boardId}` }],
    }),
    addComment: build.mutation<unknown, { id: string; body: string; boardId: string }>({
      query: ({ id, body }) => ({ url: `/tasks/${id}/comments`, method: 'POST', body: { body } }),
    }),
    assignTask: build.mutation<Task, { id: string; assigneeIds: string[]; boardId: string }>({
      query: ({ id, assigneeIds }) => ({
        url: `/tasks/${id}/assign`,
        method: 'POST',
        body: { assigneeIds },
      }),
      invalidatesTags: (_r, _e, { boardId }) => [{ type: 'Task', id: `LIST-${boardId}` }],
    }),
  }),
});

export const {
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useMoveTaskMutation,
  useDeleteTaskMutation,
  useAddCommentMutation,
  useAssignTaskMutation,
} = taskApi;
