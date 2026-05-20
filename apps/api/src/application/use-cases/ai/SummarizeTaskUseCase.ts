import { ForbiddenError, NotFoundError } from '../../../domain/errors/DomainError.js';
import type { IBoardRepository } from '../../../domain/repositories/IBoardRepository.js';
import type { ICommentRepository } from '../../../domain/repositories/ICommentRepository.js';
import type { ITaskRepository } from '../../../domain/repositories/ITaskRepository.js';
import type { IAIProvider } from '../../../domain/services/IAIProvider.js';

// Caches the result on the task itself (`aiSummary` field) so repeated views
// don't re-bill the AI provider. Invalidation: clear `aiSummary` on description
// or comment changes (UpdateTaskUseCase doesn't yet — left as a TODO in docs).
export class SummarizeTaskUseCase {
  constructor(
    private readonly tasks: ITaskRepository,
    private readonly comments: ICommentRepository,
    private readonly boards: IBoardRepository,
    private readonly ai: IAIProvider,
  ) {}

  async execute(userId: string, taskId: string) {
    const task = await this.tasks.findById(taskId);
    if (!task) throw new NotFoundError('Task', taskId);
    const board = await this.boards.findById(task.props.boardId);
    if (!board) throw new NotFoundError('Board', task.props.boardId);
    if (!board.hasMember(userId)) throw new ForbiddenError('Not a member of this board');

    const comments = await this.comments.findByTask(taskId);
    const summary = await this.ai.summarizeTask({
      title: task.props.title,
      description: task.props.description,
      comments: comments.map((c) => c.props.body),
    });

    // Persist the summary string for quick re-reads.
    await this.tasks.update(taskId, { aiSummary: summary.summary });

    return summary;
  }
}
