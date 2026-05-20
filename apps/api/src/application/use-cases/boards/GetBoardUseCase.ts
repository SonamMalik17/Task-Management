import { ForbiddenError, NotFoundError } from '../../../domain/errors/DomainError.js';
import type { IBoardRepository } from '../../../domain/repositories/IBoardRepository.js';
import type { ITaskRepository } from '../../../domain/repositories/ITaskRepository.js';

// Returns the board along with its tasks — the Kanban view's only network call.
// Bundling them avoids a waterfall on the client.
export class GetBoardUseCase {
  constructor(
    private readonly boards: IBoardRepository,
    private readonly tasks: ITaskRepository,
  ) {}

  async execute(userId: string, boardId: string) {
    const board = await this.boards.findById(boardId);
    if (!board) throw new NotFoundError('Board', boardId);
    if (!board.hasMember(userId)) throw new ForbiddenError('Not a member of this board');

    const tasks = await this.tasks.findByBoard(boardId);
    return { board: board.toJSON(), tasks: tasks.map((t) => t.toJSON()) };
  }
}
