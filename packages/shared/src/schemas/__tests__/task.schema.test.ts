import { CreateTaskInputSchema, TaskSchema } from '../task.schema';

describe('TaskSchema', () => {
  const validId = '507f1f77bcf86cd799439011';

  it('accepts a fully populated task', () => {
    const result = TaskSchema.safeParse({
      id: validId,
      boardId: validId,
      title: 'Ship docs',
      description: '',
      status: 'todo',
      priority: 'medium',
      position: 1024,
      assigneeIds: [],
      creatorId: validId,
      tags: [],
      checklist: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid ObjectId', () => {
    const result = CreateTaskInputSchema.safeParse({
      boardId: 'not-an-id',
      title: 'Hi',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty title', () => {
    const result = CreateTaskInputSchema.safeParse({
      boardId: validId,
      title: '',
    });
    expect(result.success).toBe(false);
  });
});
