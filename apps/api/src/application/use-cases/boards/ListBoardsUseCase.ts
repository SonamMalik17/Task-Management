import type { IBoardRepository } from '../../../domain/repositories/IBoardRepository.js';

export class ListBoardsUseCase {
  constructor(private readonly boards: IBoardRepository) {}

  async execute(userId: string) {
    const boards = await this.boards.findByUser(userId);
    return boards.map((b) => b.toJSON());
  }
}
