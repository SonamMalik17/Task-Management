import { Board } from '../Board.js';

const make = (overrides: Partial<Board['props']> = {}) =>
  new Board({
    id: '1',
    name: 'B',
    description: '',
    ownerId: 'owner',
    members: [],
    color: '#000000',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

describe('Board entity', () => {
  it('owner is always a member', () => {
    expect(make().hasMember('owner')).toBe(true);
  });

  it('non-member returns false', () => {
    expect(make().hasMember('stranger')).toBe(false);
  });

  it('admin and member can edit; viewer cannot', () => {
    const b = make({
      members: [
        { userId: 'admin', role: 'admin', joinedAt: new Date() },
        { userId: 'mem', role: 'member', joinedAt: new Date() },
        { userId: 'view', role: 'viewer', joinedAt: new Date() },
      ],
    });
    expect(b.canEdit('admin')).toBe(true);
    expect(b.canEdit('mem')).toBe(true);
    expect(b.canEdit('view')).toBe(false);
  });
});
