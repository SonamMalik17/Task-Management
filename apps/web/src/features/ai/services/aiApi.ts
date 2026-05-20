import type {
  DeadlineRecommendation,
  ParsedTaskDraft,
  ParseNaturalLanguageInput,
  RecommendDeadlineInput,
  SuggestTasksInput,
  TaskSuggestion,
  TaskSummary,
} from '@ai-task/shared';
import { baseApi } from '@/store/baseApi';

export const aiApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    parseTask: build.mutation<ParsedTaskDraft, ParseNaturalLanguageInput>({
      query: (body) => ({ url: '/ai/parse-task', method: 'POST', body }),
    }),
    summarizeTask: build.mutation<TaskSummary, { taskId: string }>({
      query: ({ taskId }) => ({ url: `/ai/summarize-task/${taskId}`, method: 'POST' }),
    }),
    recommendDeadline: build.mutation<DeadlineRecommendation, RecommendDeadlineInput>({
      query: (body) => ({ url: '/ai/recommend-deadline', method: 'POST', body }),
    }),
    suggestTasks: build.mutation<TaskSuggestion[], SuggestTasksInput>({
      query: (body) => ({ url: '/ai/suggest-tasks', method: 'POST', body }),
    }),
  }),
});

export const {
  useParseTaskMutation,
  useSummarizeTaskMutation,
  useRecommendDeadlineMutation,
  useSuggestTasksMutation,
} = aiApi;
