import type { RecommendDeadlineInput, DeadlineRecommendation } from '@ai-task/shared';
import type { IAIProvider } from '../../../domain/services/IAIProvider.js';

export class RecommendDeadlineUseCase {
  constructor(private readonly ai: IAIProvider) {}

  async execute(input: RecommendDeadlineInput): Promise<DeadlineRecommendation> {
    return this.ai.recommendDeadline({
      title: input.title,
      description: input.description,
      priority: input.priority,
      nowISO: new Date().toISOString(),
    });
  }
}
