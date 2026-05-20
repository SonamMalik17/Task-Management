import {
  FakePasswordHasher,
  FakeTokenService,
  FakeUserRepository,
} from '../../../../test/fakes.js';
import { ConflictError } from '../../../../domain/errors/DomainError.js';
import { RegisterUseCase } from '../RegisterUseCase.js';

describe('RegisterUseCase', () => {
  let users: FakeUserRepository;
  let hasher: FakePasswordHasher;
  let tokens: FakeTokenService;
  let usecase: RegisterUseCase;

  beforeEach(() => {
    users = new FakeUserRepository();
    hasher = new FakePasswordHasher();
    tokens = new FakeTokenService();
    usecase = new RegisterUseCase(users, hasher, tokens);
  });

  it('creates a user and returns tokens', async () => {
    const result = await usecase.execute({
      email: 'a@b.co',
      password: 'goodpass1',
      name: 'Alice',
    });
    expect(result.user.email).toBe('a@b.co');
    expect(result.accessToken).toContain('access:');
    expect(result.refreshToken).toContain('refresh:');
    expect((result.user as any).passwordHash).toBeUndefined();
  });

  it('rejects duplicate email', async () => {
    await usecase.execute({ email: 'a@b.co', password: 'goodpass1', name: 'A' });
    await expect(
      usecase.execute({ email: 'a@b.co', password: 'goodpass1', name: 'A' }),
    ).rejects.toThrow(ConflictError);
  });
});
