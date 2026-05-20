import type { RequestHandler } from 'express';
import { UnauthorizedError } from '../../../domain/errors/DomainError.js';
import { JwtTokenService } from '../../../infrastructure/auth/JwtTokenService.js';

// Augment Express's Request type with `auth`. Declared globally so every
// downstream handler has access without re-casting.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: { userId: string; email: string };
    }
  }
}

const tokens = new JwtTokenService();

export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.header('authorization');
  if (!header?.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Missing bearer token'));
  }
  try {
    const payload = tokens.verifyAccess(header.slice('Bearer '.length));
    req.auth = { userId: payload.sub, email: payload.email };
    next();
  } catch (err) {
    next(err);
  }
};
