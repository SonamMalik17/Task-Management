import type { UpdateTaskInput } from '@ai-task/shared';
import { ForbiddenError, NotFoundError } from '../../../domain/errors/DomainError.js';
import type { IActivityRepository } from '../../../domain/repositories/IActivityRepository.js';
import type { IBoardRepository } from '../../../domain/repositories/IBoardRepository.js';
import type { ITaskRepository } from '../../../domain/repositories/ITaskRepository.js';
import type { IRealtimeGateway } from '../../../domain/services/IRealtimeGateway.js';

export class UpdateTaskUseCase {
  constructor(
    private readonly tasks: ITaskRepository,
    private readonly boards: IBoardRepository,
    private readonly activity: IActivityRepository,
    private readonly realtime: IRealtimeGateway,
  ) {}

  async execute(userId: string, taskId: string, input: UpdateTaskInput) {
    const existing = await this.tasks.findById(taskId);
    if (!existing) throw new NotFoundError('Task', taskId);

    const board = await this.boards.findById(existing.props.boardId);
    if (!board) throw new NotFoundError('Board', existing.props.boardId);
    if (!board.canEdit(userId)) throw new ForbiddenError('Read-only access to this board');

    // status flip to "done" → stamp completedAt via the entity, not by hand.
    let updates: Record<string, unknown> = { ...input };
    if (input.status === 'done' && existing.props.status !== 'done') {
      updates.completedAt = new Date();
    } else if (input.status && input.status !== 'done' && existing.props.completedAt) {
      updates.completedAt = null;
    }

    const updated = await this.tasks.update(taskId, updates);

    await this.activity.create({
      boardId: existing.props.boardId,
      actorId: userId,
      action: input.status === 'done' ? 'task.completed' : 'task.updated',
      metadata: { taskId, changes: Object.keys(input) },
    });

    this.realtime.emitToBoard(existing.props.boardId, 'task:updated', updated.toJSON());
    return updated.toJSON();
  }
}
