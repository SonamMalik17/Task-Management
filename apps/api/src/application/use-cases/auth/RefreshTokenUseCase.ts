import { UnauthorizedError } from '../../../domain/errors/DomainError.js';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository.js';
import type { ITokenService } from '../../../domain/services/ITokenService.js';

export class RefreshTokenUseCase {
  constructor(
    private readonly users: IUserRepository,
    private readonly tokens: ITokenService,
  ) {}

  async execute(refreshToken: string) {
    const payload = this.tokens.verifyRefresh(refreshToken);
    // Re-fetch the user to catch deletions/disablements between issuance and refresh.
    const user = await this.users.findById(payload.sub);
    if (!user) throw new UnauthorizedError('User no longer exists');
    const pair = this.tokens.issuePair({ sub: user.id, email: user.email });
    return { user: user.toPublicJSON(), ...pair };
  }
}
