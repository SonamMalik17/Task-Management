import { ForbiddenError, NotFoundError } from '../../../domain/errors/DomainError.js';
import type { IActivityRepository } from '../../../domain/repositories/IActivityRepository.js';
import type { IBoardRepository } from '../../../domain/repositories/IBoardRepository.js';
import type { ITaskRepository } from '../../../domain/repositories/ITaskRepository.js';
import type { IRealtimeGateway } from '../../../domain/services/IRealtimeGateway.js';

export class DeleteTaskUseCase {
  constructor(
    private readonly tasks: ITaskRepository,
    private readonly boards: IBoardRepository,
    private readonly activity: IActivityRepository,
    private readonly realtime: IRealtimeGateway,
  ) {}

  async execute(userId: string, taskId: string) {
    const existing = await this.tasks.findById(taskId);
    if (!existing) throw new NotFoundError('Task', taskId);

    const board = await this.boards.findById(existing.props.boardId);
    if (!board) throw new NotFoundError('Board', existing.props.boardId);
    if (!board.canEdit(userId)) throw new ForbiddenError('Read-only access to this board');

    await this.tasks.delete(taskId);
    await this.activity.create({
      boardId: existing.props.boardId,
      actorId: userId,
      action: 'task.deleted',
      metadata: { taskId, title: existing.props.title },
    });
    this.realtime.emitToBoard(existing.props.boardId, 'task:deleted', { taskId });
  }
}
