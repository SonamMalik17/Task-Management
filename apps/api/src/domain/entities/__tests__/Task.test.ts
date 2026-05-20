import { Task } from '../Task.js';

const make = (overrides: Partial<Task['props']> = {}) =>
  new Task({
    id: '1',
    boardId: 'b',
    title: 't',
    description: '',
    status: 'todo',
    priority: 'medium',
    position: 1,
    assigneeIds: [],
    creatorId: 'u',
    tags: [],
    checklist: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

describe('Task entity', () => {
  it('markComplete sets status, completedAt, and updatedAt', () => {
    const t = make();
    const done = t.markComplete(new Date('2026-01-01'));
    expect(done.props.status).toBe('done');
    expect(done.props.completedAt).toEqual(new Date('2026-01-01'));
  });

  it('isOverdue is true only when past due AND not done', () => {
    const yesterday = new Date(Date.now() - 86_400_000);
    expect(make({ dueDate: yesterday }).isOverdue()).toBe(true);
    expect(make({ dueDate: yesterday, status: 'done' }).isOverdue()).toBe(false);
    expect(make({ dueDate: null }).isOverdue()).toBe(false);
  });
});
