import {
  FakeActivityRepository,
  FakeBoardRepository,
  FakeNotificationRepository,
  FakeRealtime,
  FakeTaskRepository,
} from '../../../../test/fakes.js';
import { AssignTaskUseCase } from '../AssignTaskUseCase.js';
import { CreateTaskUseCase } from '../CreateTaskUseCase.js';

describe('AssignTaskUseCase', () => {
  it('only notifies newly added assignees', async () => {
    const boards = new FakeBoardRepository();
    const tasks = new FakeTaskRepository();
    const activity = new FakeActivityRepository();
    const notifs = new FakeNotificationRepository();
    const realtime = new FakeRealtime();
    const board = await boards.create({
      name: 'B',
      description: '',
      ownerId: 'u1',
      members: [],
      color: '#000000',
    });
    const create = new CreateTaskUseCase(tasks, boards, activity, realtime);
    const assign = new AssignTaskUseCase(tasks, boards, activity, notifs, realtime);
    const t = await create.execute('u1', {
      boardId: board.id,
      title: 'X',
      assigneeIds: ['existing'],
    });
    realtime.emitted.length = 0;
    await assign.execute('u1', t.id, ['existing', 'newcomer']);
    const userNotifs = await notifs.listForUser('newcomer');
    expect(userNotifs.length).toBe(1);
    const existingNotifs = await notifs.listForUser('existing');
    expect(existingNotifs.length).toBe(0);
  });
});
