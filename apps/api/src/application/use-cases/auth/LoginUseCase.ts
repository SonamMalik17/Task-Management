import type { LoginInput } from '@ai-task/shared';
import { UnauthorizedError } from '../../../domain/errors/DomainError.js';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository.js';
import type { IPasswordHasher } from '../../../domain/services/IPasswordHasher.js';
import type { ITokenService } from '../../../domain/services/ITokenService.js';

export class LoginUseCase {
  constructor(
    private readonly users: IUserRepository,
    private readonly hasher: IPasswordHasher,
    private readonly tokens: ITokenService,
  ) {}

  async execute(input: LoginInput) {
    const user = await this.users.findByEmail(input.email);
    // Use the same error for "no such user" and "wrong password" — don't
    // give an attacker a side-channel to enumerate registered emails.
    const invalid = new UnauthorizedError('Invalid email or password');
    if (!user) throw invalid;

    const ok = await this.hasher.verify(input.password, user.props.passwordHash);
    if (!ok) throw invalid;

    const pair = this.tokens.issuePair({ sub: user.id, email: user.email });
    return { user: user.toPublicJSON(), ...pair };
  }
}
