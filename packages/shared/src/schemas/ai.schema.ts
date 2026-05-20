import { z } from 'zod';
import { TASK_PRIORITIES } from '../constants';
import { ObjectIdSchema } from './common.schema';

// === AI: Natural-language task creation ===
export const ParseNaturalLanguageInputSchema = z.object({
  boardId: ObjectIdSchema,
  text: z.string().min(3).max(2000),
});

export const ParsedTaskDraftSchema = z.object({
  title: z.string(),
  description: z.string().default(''),
  priority: z.enum(TASK_PRIORITIES).default('medium'),
  dueDate: z.coerce.date().nullable().optional(),
  tags: z.array(z.string()).default([]),
  // `confidence` lets the UI signal uncertainty to the user, rather than silently
  // committing a low-confidence parse as a real task.
  confidence: z.number().min(0).max(1),
});

// === AI: Summarize a task (description + comments) ===
export const SummarizeTaskInputSchema = z.object({
  taskId: ObjectIdSchema,
});

export const TaskSummarySchema = z.object({
  summary: z.string(),
  nextSteps: z.array(z.string()).default([]),
  risks: z.array(z.string()).default([]),
});

// === AI: Deadline recommendation ===
export const RecommendDeadlineInputSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(10_000).optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
});

export const DeadlineRecommendationSchema = z.object({
  recommendedDueDate: z.coerce.date(),
  rationale: z.string(),
});

// === AI: Suggest next tasks for a board ===
export const SuggestTasksInputSchema = z.object({
  boardId: ObjectIdSchema,
  // Free-form intent: "I'm building a launch checklist for next week"
  intent: z.string().min(3).max(500).optional(),
  count: z.number().int().min(1).max(10).default(5),
});

export const TaskSuggestionSchema = z.object({
  title: z.string(),
  description: z.string().default(''),
  priority: z.enum(TASK_PRIORITIES).default('medium'),
  reason: z.string(),
});

export type ParseNaturalLanguageInput = z.infer<typeof ParseNaturalLanguageInputSchema>;
export type ParsedTaskDraft = z.infer<typeof ParsedTaskDraftSchema>;
export type SummarizeTaskInput = z.infer<typeof SummarizeTaskInputSchema>;
export type TaskSummary = z.infer<typeof TaskSummarySchema>;
export type RecommendDeadlineInput = z.infer<typeof RecommendDeadlineInputSchema>;
export type DeadlineRecommendation = z.infer<typeof DeadlineRecommendationSchema>;
export type SuggestTasksInput = z.infer<typeof SuggestTasksInputSchema>;
export type TaskSuggestion = z.infer<typeof TaskSuggestionSchema>;
