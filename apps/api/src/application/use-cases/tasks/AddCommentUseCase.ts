import { ForbiddenError, NotFoundError } from '../../../domain/errors/DomainError.js';
import type { IActivityRepository } from '../../../domain/repositories/IActivityRepository.js';
import type { IBoardRepository } from '../../../domain/repositories/IBoardRepository.js';
import type { ICommentRepository } from '../../../domain/repositories/ICommentRepository.js';
import type { INotificationRepository } from '../../../domain/repositories/INotificationRepository.js';
import type { ITaskRepository } from '../../../domain/repositories/ITaskRepository.js';
import type { IRealtimeGateway } from '../../../domain/services/IRealtimeGateway.js';

export class AddCommentUseCase {
  constructor(
    private readonly comments: ICommentRepository,
    private readonly tasks: ITaskRepository,
    private readonly boards: IBoardRepository,
    private readonly activity: IActivityRepository,
    private readonly notifications: INotificationRepository,
    private readonly realtime: IRealtimeGateway,
  ) {}

  async execute(userId: string, taskId: string, body: string) {
    const task = await this.tasks.findById(taskId);
    if (!task) throw new NotFoundError('Task', taskId);
    const board = await this.boards.findById(task.props.boardId);
    if (!board) throw new NotFoundError('Board', task.props.boardId);
    if (!board.hasMember(userId)) throw new ForbiddenError('Not a member of this board');

    const comment = await this.comments.create({ taskId, authorId: userId, body });
    await this.activity.create({
      boardId: task.props.boardId,
      actorId: userId,
      action: 'comment.added',
      metadata: { taskId, commentId: comment.id },
    });

    // Notify assignees other than the commenter.
    const recipients = task.props.assigneeIds.filter((id) => id !== userId);
    await Promise.all(
      recipients.map((uid) =>
        this.notifications.create({
          userId: uid,
          type: 'comment',
          title: 'New comment on a task you own',
          body: body.slice(0, 140),
          link: `/board/${task.props.boardId}?task=${taskId}`,
        }),
      ),
    );
    recipients.forEach((uid) => this.realtime.emitToUser(uid, 'notification:new', { taskId }));
    this.realtime.emitToBoard(task.props.boardId, 'comment:created', comment.toJSON());

    return comment.toJSON();
  }
}
