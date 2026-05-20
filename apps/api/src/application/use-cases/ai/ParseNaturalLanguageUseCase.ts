import type { ParseNaturalLanguageInput, ParsedTaskDraft } from '@ai-task/shared';
import { ForbiddenError, NotFoundError } from '../../../domain/errors/DomainError.js';
import type { IBoardRepository } from '../../../domain/repositories/IBoardRepository.js';
import type { IAIProvider } from '../../../domain/services/IAIProvider.js';

// Returns a DRAFT, not a created task. The web UI displays the draft so the
// user can confirm/edit before committing — important when AI confidence is low.
export class ParseNaturalLanguageUseCase {
  constructor(
    private readonly boards: IBoardRepository,
    private readonly ai: IAIProvider,
  ) {}

  async execute(userId: string, input: ParseNaturalLanguageInput): Promise<ParsedTaskDraft> {
    const board = await this.boards.findById(input.boardId);
    if (!board) throw new NotFoundError('Board', input.boardId);
    if (!board.canEdit(userId)) throw new ForbiddenError('Read-only access to this board');

    return this.ai.parseNaturalLanguageTask({
      text: input.text,
      nowISO: new Date().toISOString(),
    });
  }
}
