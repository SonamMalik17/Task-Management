import type { CreateTaskInput } from '@ai-task/shared';
import { ForbiddenError, NotFoundError } from '../../../domain/errors/DomainError.js';
import type { IActivityRepository } from '../../../domain/repositories/IActivityRepository.js';
import type { IBoardRepository } from '../../../domain/repositories/IBoardRepository.js';
import type { ITaskRepository } from '../../../domain/repositories/ITaskRepository.js';
import type { IRealtimeGateway } from '../../../domain/services/IRealtimeGateway.js';

export class CreateTaskUseCase {
  constructor(
    private readonly tasks: ITaskRepository,
    private readonly boards: IBoardRepository,
    private readonly activity: IActivityRepository,
    private readonly realtime: IRealtimeGateway,
  ) {}

  async execute(userId: string, input: CreateTaskInput) {
    const board = await this.boards.findById(input.boardId);
    if (!board) throw new NotFoundError('Board', input.boardId);
    if (!board.canEdit(userId)) throw new ForbiddenError('Read-only access to this board');

    const status = input.status ?? 'todo';
    const position = await this.tasks.nextPositionInStatus(input.boardId, status);

    const task = await this.tasks.create({
      boardId: input.boardId,
      title: input.title,
      description: input.description ?? '',
      status,
      priority: input.priority ?? 'medium',
      position,
      assigneeIds: input.assigneeIds ?? [],
      creatorId: userId,
      dueDate: input.dueDate ?? null,
      tags: input.tags ?? [],
      checklist: [],
      aiSummary: null,
      completedAt: null,
    });

    await this.activity.create({
      boardId: input.boardId,
      actorId: userId,
      action: 'task.created',
      metadata: { taskId: task.id, title: task.props.title },
    });

    this.realtime.emitToBoard(input.boardId, 'task:created', task.toJSON());
    return task.toJSON();
  }
}
