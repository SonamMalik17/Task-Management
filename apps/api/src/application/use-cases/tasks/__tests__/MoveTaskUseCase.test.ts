import {
  FakeActivityRepository,
  FakeBoardRepository,
  FakeRealtime,
  FakeTaskRepository,
} from '../../../../test/fakes.js';
import { CreateTaskUseCase } from '../CreateTaskUseCase.js';
import { MoveTaskUseCase } from '../MoveTaskUseCase.js';

describe('MoveTaskUseCase', () => {
  it('stamps completedAt when moved to done, clears it on reopen', async () => {
    const boards = new FakeBoardRepository();
    const tasks = new FakeTaskRepository();
    const activity = new FakeActivityRepository();
    const realtime = new FakeRealtime();
    const board = await boards.create({
      name: 'B',
      description: '',
      ownerId: 'u1',
      members: [],
      color: '#000000',
    });
    const create = new CreateTaskUseCase(tasks, boards, activity, realtime);
    const move = new MoveTaskUseCase(tasks, boards, activity, realtime);
    const t = await create.execute('u1', { boardId: board.id, title: 'X' });

    const done = await move.execute('u1', t.id, { status: 'done', position: 1024 });
    expect(done.completedAt).toBeTruthy();

    const reopened = await move.execute('u1', t.id, { status: 'todo', position: 2048 });
    expect(reopened.completedAt).toBeNull();
  });
});
