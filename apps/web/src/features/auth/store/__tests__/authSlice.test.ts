/**
 * @jest-environment jsdom
 */
import { authReducer, setCredentials, signOut } from '../authSlice';

const sampleUser = {
  id: '507f1f77bcf86cd799439011',
  email: 'a@b.co',
  name: 'A',
  avatarUrl: null,
  role: 'member' as const,
};

describe('authSlice', () => {
  beforeEach(() => window.localStorage.clear());

  it('starts unauthenticated', () => {
    const state = authReducer(undefined, { type: '@@INIT' });
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
  });

  it('persists credentials to localStorage', () => {
    const state = authReducer(
      undefined,
      setCredentials({ user: sampleUser, accessToken: 'a', refreshToken: 'r' }),
    );
    expect(state.accessToken).toBe('a');
    expect(window.localStorage.getItem('ai-task-auth')).toContain('a@b.co');
  });

  it('clears credentials on signOut', () => {
    const seeded = authReducer(
      undefined,
      setCredentials({ user: sampleUser, accessToken: 'a', refreshToken: 'r' }),
    );
    const state = authReducer(seeded, signOut());
    expect(state.user).toBeNull();
    expect(window.localStorage.getItem('ai-task-auth')).toBeNull();
  });
});
