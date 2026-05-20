import { ForbiddenError, NotFoundError } from '../../../domain/errors/DomainError.js';
import type { IActivityRepository } from '../../../domain/repositories/IActivityRepository.js';
import type { IBoardRepository } from '../../../domain/repositories/IBoardRepository.js';
import type { INotificationRepository } from '../../../domain/repositories/INotificationRepository.js';
import type { ITaskRepository } from '../../../domain/repositories/ITaskRepository.js';
import type { IRealtimeGateway } from '../../../domain/services/IRealtimeGateway.js';

export class AssignTaskUseCase {
  constructor(
    private readonly tasks: ITaskRepository,
    private readonly boards: IBoardRepository,
    private readonly activity: IActivityRepository,
    private readonly notifications: INotificationRepository,
    private readonly realtime: IRealtimeGateway,
  ) {}

  async execute(userId: string, taskId: string, assigneeIds: string[]) {
    const task = await this.tasks.findById(taskId);
    if (!task) throw new NotFoundError('Task', taskId);
    const board = await this.boards.findById(task.props.boardId);
    if (!board) throw new NotFoundError('Board', task.props.boardId);
    if (!board.canEdit(userId)) throw new ForbiddenError('Read-only access to this board');

    const newlyAssigned = assigneeIds.filter((id) => !task.props.assigneeIds.includes(id));
    const updated = await this.tasks.update(taskId, { assigneeIds });

    await this.activity.create({
      boardId: task.props.boardId,
      actorId: userId,
      action: 'task.assigned',
      metadata: { taskId, assigneeIds },
    });

    await Promise.all(
      newlyAssigned.map((uid) =>
        this.notifications.create({
          userId: uid,
          type: 'task_assigned',
          title: 'You were assigned a task',
          body: task.props.title,
          link: `/board/${task.props.boardId}?task=${taskId}`,
        }),
      ),
    );
    newlyAssigned.forEach((uid) => this.realtime.emitToUser(uid, 'notification:new', { taskId }));
    this.realtime.emitToBoard(task.props.boardId, 'task:updated', updated.toJSON());

    return updated.toJSON();
  }
}
