import type { MoveTaskInput } from '@ai-task/shared';
import { ForbiddenError, NotFoundError } from '../../../domain/errors/DomainError.js';
import type { IActivityRepository } from '../../../domain/repositories/IActivityRepository.js';
import type { IBoardRepository } from '../../../domain/repositories/IBoardRepository.js';
import type { ITaskRepository } from '../../../domain/repositories/ITaskRepository.js';
import type { IRealtimeGateway } from '../../../domain/services/IRealtimeGateway.js';

// Kanban move = (status, position) change. Separated from UpdateTask because
// the activity-log action ("task.moved") is semantically distinct, and the
// realtime event the UI listens for ("task:moved") is too.
export class MoveTaskUseCase {
  constructor(
    private readonly tasks: ITaskRepository,
    private readonly boards: IBoardRepository,
    private readonly activity: IActivityRepository,
    private readonly realtime: IRealtimeGateway,
  ) {}

  async execute(userId: string, taskId: string, input: MoveTaskInput) {
    const existing = await this.tasks.findById(taskId);
    if (!existing) throw new NotFoundError('Task', taskId);

    const board = await this.boards.findById(existing.props.boardId);
    if (!board) throw new NotFoundError('Board', existing.props.boardId);
    if (!board.canEdit(userId)) throw new ForbiddenError('Read-only access to this board');

    const updates: Record<string, unknown> = {
      status: input.status,
      position: input.position,
    };
    if (input.status === 'done' && existing.props.status !== 'done') {
      updates.completedAt = new Date();
    } else if (input.status !== 'done' && existing.props.completedAt) {
      updates.completedAt = null;
    }

    const updated = await this.tasks.update(taskId, updates);

    await this.activity.create({
      boardId: existing.props.boardId,
      actorId: userId,
      action: 'task.moved',
      metadata: {
        taskId,
        from: existing.props.status,
        to: input.status,
      },
    });

    this.realtime.emitToBoard(existing.props.boardId, 'task:moved', updated.toJSON());
    return updated.toJSON();
  }
}
