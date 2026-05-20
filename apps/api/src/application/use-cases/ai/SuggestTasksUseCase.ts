import type { SuggestTasksInput, TaskSuggestion } from '@ai-task/shared';
import { ForbiddenError, NotFoundError } from '../../../domain/errors/DomainError.js';
import type { IBoardRepository } from '../../../domain/repositories/IBoardRepository.js';
import type { ITaskRepository } from '../../../domain/repositories/ITaskRepository.js';
import type { IAIProvider } from '../../../domain/services/IAIProvider.js';

export class SuggestTasksUseCase {
  constructor(
    private readonly boards: IBoardRepository,
    private readonly tasks: ITaskRepository,
    private readonly ai: IAIProvider,
  ) {}

  async execute(userId: string, input: SuggestTasksInput): Promise<TaskSuggestion[]> {
    const board = await this.boards.findById(input.boardId);
    if (!board) throw new NotFoundError('Board', input.boardId);
    if (!board.hasMember(userId)) throw new ForbiddenError('Not a member of this board');

    const existing = await this.tasks.findByBoard(input.boardId);
    return this.ai.suggestTasks({
      boardName: board.props.name,
      existingTitles: existing.map((t) => t.props.title),
      intent: input.intent,
      count: input.count,
    });
  }
}
