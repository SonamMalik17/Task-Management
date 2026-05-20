import { ForbiddenError } from '../../../../domain/errors/DomainError.js';
import {
  FakeBoardRepository,
  FakeTaskRepository,
  makeFakeAI,
} from '../../../../test/fakes.js';
import { SuggestTasksUseCase } from '../SuggestTasksUseCase.js';

describe('SuggestTasksUseCase', () => {
  it('forwards board context to the AI provider and respects count', async () => {
    const boards = new FakeBoardRepository();
    const tasks = new FakeTaskRepository();
    const ai = makeFakeAI();
    const board = await boards.create({
      name: 'Launch',
      description: '',
      ownerId: 'u1',
      members: [],
      color: '#000',
    });
    const usecase = new SuggestTasksUseCase(boards, tasks, ai);
    const result = await usecase.execute('u1', { boardId: board.id, count: 3 });
    expect(result.length).toBeLessThanOrEqual(3);
    expect(result[0]).toHaveProperty('title');
    expect(result[0]).toHaveProperty('reason');
  });

  it('rejects non-members', async () => {
    const boards = new FakeBoardRepository();
    const tasks = new FakeTaskRepository();
    const board = await boards.create({
      name: 'B',
      description: '',
      ownerId: 'u1',
      members: [],
      color: '#000',
    });
    const usecase = new SuggestTasksUseCase(boards, tasks, makeFakeAI());
    await expect(usecase.execute('intruder', { boardId: board.id, count: 3 })).rejects.toThrow(
      ForbiddenError,
    );
  });
});
