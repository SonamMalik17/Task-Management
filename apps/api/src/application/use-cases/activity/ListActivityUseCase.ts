import { ForbiddenError, NotFoundError } from '../../../domain/errors/DomainError.js';
import type { IActivityRepository } from '../../../domain/repositories/IActivityRepository.js';
import type { IBoardRepository } from '../../../domain/repositories/IBoardRepository.js';

export class ListActivityUseCase {
  constructor(
    private readonly activity: IActivityRepository,
    private readonly boards: IBoardRepository,
  ) {}

  async execute(userId: string, boardId: string, limit = 50) {
    const board = await this.boards.findById(boardId);
    if (!board) throw new NotFoundError('Board', boardId);
    if (!board.hasMember(userId)) throw new ForbiddenError('Not a member of this board');
    const logs = await this.activity.listByBoard(boardId, limit);
    return logs.map((l) => l.toJSON());
  }
}
