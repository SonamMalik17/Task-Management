import type { InviteMemberInput } from '@ai-task/shared';
import { ForbiddenError, NotFoundError } from '../../../domain/errors/DomainError.js';
import type { IBoardRepository } from '../../../domain/repositories/IBoardRepository.js';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository.js';
import type { IActivityRepository } from '../../../domain/repositories/IActivityRepository.js';
import type { INotificationRepository } from '../../../domain/repositories/INotificationRepository.js';
import type { IRealtimeGateway } from '../../../domain/services/IRealtimeGateway.js';

export class InviteMemberUseCase {
  constructor(
    private readonly boards: IBoardRepository,
    private readonly users: IUserRepository,
    private readonly activity: IActivityRepository,
    private readonly notifications: INotificationRepository,
    private readonly realtime: IRealtimeGateway,
  ) {}

  async execute(actorId: string, boardId: string, input: InviteMemberInput) {
    const board = await this.boards.findById(boardId);
    if (!board) throw new NotFoundError('Board', boardId);
    // Only owner/admin can invite. Members can collaborate, not grow the team.
    if (board.props.ownerId !== actorId) {
      const me = board.props.members.find((m) => m.userId === actorId);
      if (!me || me.role !== 'admin') throw new ForbiddenError('Only owner or admin can invite');
    }

    const invitee = await this.users.findByEmail(input.email);
    if (!invitee) throw new NotFoundError('User');

    const updated = await this.boards.addMember(boardId, invitee.id, input.role);

    await Promise.all([
      this.activity.create({
        boardId,
        actorId,
        action: 'member.added',
        metadata: { invitedUserId: invitee.id, role: input.role },
      }),
      this.notifications.create({
        userId: invitee.id,
        type: 'board_invite',
        title: 'You were added to a board',
        body: `You've been added to "${board.props.name}" as ${input.role}.`,
        link: `/board/${boardId}`,
      }),
    ]);

    this.realtime.emitToUser(invitee.id, 'notification:new', {
      type: 'board_invite',
      boardId,
    });

    return updated.toJSON();
  }
}
