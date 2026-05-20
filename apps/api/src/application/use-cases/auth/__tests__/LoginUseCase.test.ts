import {
  FakePasswordHasher,
  FakeTokenService,
  FakeUserRepository,
} from '../../../../test/fakes.js';
import { UnauthorizedError } from '../../../../domain/errors/DomainError.js';
import { LoginUseCase } from '../LoginUseCase.js';
import { RegisterUseCase } from '../RegisterUseCase.js';

describe('LoginUseCase', () => {
  let users: FakeUserRepository;
  let hasher: FakePasswordHasher;
  let tokens: FakeTokenService;

  beforeEach(async () => {
    users = new FakeUserRepository();
    hasher = new FakePasswordHasher();
    tokens = new FakeTokenService();
    await new RegisterUseCase(users, hasher, tokens).execute({
      email: 'a@b.co',
      password: 'goodpass1',
      name: 'Alice',
    });
  });

  it('issues tokens on correct credentials', async () => {
    const result = await new LoginUseCase(users, hasher, tokens).execute({
      email: 'a@b.co',
      password: 'goodpass1',
    });
    expect(result.accessToken).toBeTruthy();
  });

  it('rejects unknown email with same error as wrong password', async () => {
    const usecase = new LoginUseCase(users, hasher, tokens);
    await expect(
      usecase.execute({ email: 'nope@b.co', password: 'goodpass1' }),
    ).rejects.toThrow(UnauthorizedError);
    await expect(
      usecase.execute({ email: 'a@b.co', password: 'WRONGPASSWORD' }),
    ).rejects.toThrow(UnauthorizedError);
  });
});
