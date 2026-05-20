import { ForbiddenError, NotFoundError } from '../../../../domain/errors/DomainError.js';
import {
  FakeActivityRepository,
  FakeBoardRepository,
  FakeRealtime,
  FakeTaskRepository,
} from '../../../../test/fakes.js';
import { CreateTaskUseCase } from '../CreateTaskUseCase.js';

describe('CreateTaskUseCase', () => {
  let boards: FakeBoardRepository;
  let tasks: FakeTaskRepository;
  let activity: FakeActivityRepository;
  let realtime: FakeRealtime;
  let usecase: CreateTaskUseCase;
  let boardId: string;

  beforeEach(async () => {
    boards = new FakeBoardRepository();
    tasks = new FakeTaskRepository();
    activity = new FakeActivityRepository();
    realtime = new FakeRealtime();
    usecase = new CreateTaskUseCase(tasks, boards, activity, realtime);
    const board = await boards.create({
      name: 'Board',
      description: '',
      ownerId: 'user1',
      members: [],
      color: '#000000',
    });
    boardId = board.id;
  });

  it('creates a task, logs activity, and emits realtime', async () => {
    const result = await usecase.execute('user1', { boardId, title: 'Do thing' });
    expect(result.title).toBe('Do thing');
    expect(result.position).toBe(1024);
    expect([...activity.byId.values()][0]?.props.action).toBe('task.created');
    expect(realtime.emitted[0]?.event).toBe('task:created');
  });

  it('rejects when board does not exist', async () => {
    await expect(
      usecase.execute('user1', { boardId: '0'.repeat(24), title: 'X' }),
    ).rejects.toThrow(NotFoundError);
  });

  it('rejects when user is not a board editor', async () => {
    await expect(usecase.execute('intruder', { boardId, title: 'X' })).rejects.toThrow(
      ForbiddenError,
    );
  });

  it('assigns sequential positions per status', async () => {
    const a = await usecase.execute('user1', { boardId, title: 'A' });
    const b = await usecase.execute('user1', { boardId, title: 'B' });
    expect(b.position).toBeGreaterThan(a.position);
  });
});
