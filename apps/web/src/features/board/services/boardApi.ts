import type { Board, CreateBoardInput, Task } from '@ai-task/shared';
import { baseApi } from '@/store/baseApi';

interface BoardWithTasks {
  board: Board;
  tasks: Task[];
}

export const boardApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listBoards: build.query<Board[], void>({
      query: () => '/boards',
      providesTags: (result) =>
        result ? [...result.map((b) => ({ type: 'Board' as const, id: b.id })), 'Board'] : ['Board'],
    }),
    getBoard: build.query<BoardWithTasks, string>({
      query: (id) => `/boards/${id}`,
      providesTags: (_r, _e, id) => [
        { type: 'Board', id },
        { type: 'Task', id: `LIST-${id}` },
      ],
    }),
    createBoard: build.mutation<Board, CreateBoardInput>({
      query: (body) => ({ url: '/boards', method: 'POST', body }),
      invalidatesTags: ['Board'],
    }),
    inviteMember: build.mutation<Board, { boardId: string; email: string; role: string }>({
      query: ({ boardId, ...body }) => ({
        url: `/boards/${boardId}/members`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { boardId }) => [{ type: 'Board', id: boardId }],
    }),
  }),
});

export const {
  useListBoardsQuery,
  useGetBoardQuery,
  useCreateBoardMutation,
  useInviteMemberMutation,
} = boardApi;
