import type {
  DeadlineRecommendation,
  ParsedTaskDraft,
  TaskSuggestion,
  TaskSummary,
} from '@ai-task/shared';

// The IAIProvider interface decouples use-cases from any specific vendor.
// Implementations: AnthropicProvider (real), MockProvider (deterministic, no network).
// Use-cases never know which is wired in — the DI container decides at boot.
export interface IAIProvider {
  parseNaturalLanguageTask(input: { text: string; nowISO: string }): Promise<ParsedTaskDraft>;
  summarizeTask(input: {
    title: string;
    description: string;
    comments: string[];
  }): Promise<TaskSummary>;
  recommendDeadline(input: {
    title: string;
    description?: string;
    priority?: string;
    nowISO: string;
  }): Promise<DeadlineRecommendation>;
  suggestTasks(input: {
    boardName: string;
    existingTitles: string[];
    intent?: string;
    count: number;
  }): Promise<TaskSuggestion[]>;
}
