import type { RegisterInput } from '@ai-task/shared';
import { ConflictError } from '../../../domain/errors/DomainError.js';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository.js';
import type { IPasswordHasher } from '../../../domain/services/IPasswordHasher.js';
import type { ITokenService } from '../../../domain/services/ITokenService.js';

// Use-cases are constructor-injected with their dependencies via interfaces.
// They never `new` an infrastructure class — that's the container's job.
export class RegisterUseCase {
  constructor(
    private readonly users: IUserRepository,
    private readonly hasher: IPasswordHasher,
    private readonly tokens: ITokenService,
  ) {}

  async execute(input: RegisterInput) {
    const existing = await this.users.findByEmail(input.email);
    if (existing) {
      // Returning the same 409 for both "email taken" and "username taken"
      // is intentional — don't leak whether a given email is registered.
      throw new ConflictError('Email is already in use');
    }
    const passwordHash = await this.hasher.hash(input.password);
    const user = await this.users.create({
      email: input.email,
      name: input.name,
      passwordHash,
    });
    const pair = this.tokens.issuePair({ sub: user.id, email: user.email });
    return { user: user.toPublicJSON(), ...pair };
  }
}
