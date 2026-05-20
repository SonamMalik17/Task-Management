import type { CreateBoardInput } from '@ai-task/shared';
import type { IBoardRepository } from '../../../domain/repositories/IBoardRepository.js';
import type { IActivityRepository } from '../../../domain/repositories/IActivityRepository.js';

export class CreateBoardUseCase {
  constructor(
    private readonly boards: IBoardRepository,
    private readonly activity: IActivityRepository,
  ) {}

  async execute(userId: string, input: CreateBoardInput) {
    const board = await this.boards.create({
      name: input.name,
      description: input.description ?? '',
      ownerId: userId,
      members: [{ userId, role: 'owner', joinedAt: new Date() }],
      color: input.color ?? '#6366f1',
    });
    await this.activity.create({
      boardId: board.id,
      actorId: userId,
      action: 'board.created',
      metadata: { boardName: board.props.name },
    });
    return board.toJSON();
  }
}
