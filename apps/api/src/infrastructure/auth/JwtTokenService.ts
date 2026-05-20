import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { UnauthorizedError } from '../../domain/errors/DomainError.js';
import type {
  ITokenService,
  TokenPair,
  TokenPayload,
} from '../../domain/services/ITokenService.js';

// Two-token pattern: short-lived access + long-lived refresh.
// Refresh tokens use a separate secret so a leaked access token can't be
// promoted into a refresh token.
export class JwtTokenService implements ITokenService {
  issuePair(payload: TokenPayload): TokenPair {
    const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_TTL,
    } as SignOptions);
    const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_TTL,
    } as SignOptions);
    return { accessToken, refreshToken };
  }

  verifyAccess(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
      return { sub: decoded.sub, email: decoded.email };
    } catch {
      throw new UnauthorizedError('Invalid or expired access token');
    }
  }

  verifyRefresh(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
      return { sub: decoded.sub, email: decoded.email };
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
  }
}
