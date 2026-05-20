import type { TaskPriority } from '@ai-task/shared';
import type {
  DeadlineRecommendation,
  ParsedTaskDraft,
  TaskSuggestion,
  TaskSummary,
} from '@ai-task/shared';
import type { IAIProvider } from '../../domain/services/IAIProvider.js';

// Deterministic, network-free implementation. Used when ANTHROPIC_API_KEY is
// not set — enables local dev, CI, and demos without a live model. Outputs are
// not meant to look intelligent; they're meant to keep the system wired and
// testable end-to-end.
export class MockAIProvider implements IAIProvider {
  async parseNaturalLanguageTask(input: { text: string; nowISO: string }): Promise<ParsedTaskDraft> {
    const text = input.text.trim();
    const title = text.length > 80 ? text.slice(0, 77) + '...' : text;
    const priority: TaskPriority = /asap|urgent|critical|blocker/i.test(text)
      ? 'urgent'
      : /important|soon|priority/i.test(text)
        ? 'high'
        : /later|eventually|someday/i.test(text)
          ? 'low'
          : 'medium';
    return {
      title,
      description: '',
      priority,
      dueDate: null,
      tags: [],
      confidence: 0.6,
    };
  }

  async summarizeTask(input: {
    title: string;
    description: string;
    comments: string[];
  }): Promise<TaskSummary> {
    return {
      summary: `Task "${input.title}" — ${input.description ? input.description.slice(0, 120) : 'no description provided'}.`,
      nextSteps: input.comments.length
        ? ['Review the latest comment', 'Confirm scope with the team']
        : ['Add a description', 'Assign an owner'],
      risks: [],
    };
  }

  async recommendDeadline(input: {
    title: string;
    priority?: string;
    nowISO: string;
  }): Promise<DeadlineRecommendation> {
    const daysOut =
      input.priority === 'urgent'
        ? 2
        : input.priority === 'high'
          ? 5
          : input.priority === 'low'
            ? 21
            : 10;
    const now = new Date(input.nowISO);
    const due = new Date(now);
    due.setDate(due.getDate() + daysOut);
    return {
      recommendedDueDate: due,
      rationale: `Mock provider: priority "${input.priority ?? 'medium'}" → ${daysOut} days out.`,
    };
  }

  async suggestTasks(input: {
    boardName: string;
    existingTitles: string[];
    intent?: string;
    count: number;
  }): Promise<TaskSuggestion[]> {
    const seeds = [
      'Define acceptance criteria',
      'Draft technical design doc',
      'Add monitoring and alerts',
      'Write integration tests',
      'Update documentation',
      'Schedule stakeholder review',
      'Plan rollback strategy',
      'Audit security implications',
      'Benchmark performance',
      'Set up feature flag',
    ];
    return seeds
      .filter((s) => !input.existingTitles.includes(s))
      .slice(0, input.count)
      .map((title) => ({
        title,
        description: input.intent ? `Related to: ${input.intent}` : '',
        priority: 'medium' as const,
        reason: `Suggested for "${input.boardName}".`,
      }));
  }
}
