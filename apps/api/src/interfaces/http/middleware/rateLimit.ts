import rateLimit, { type Options } from 'express-rate-limit';
import { env } from '../../../config/env.js';

// Three buckets:
// - default: generous, applied to most routes
// - auth: tighter, prevents credential stuffing
// - ai: very tight, AI calls are expensive
//
// In NODE_ENV=test we skip rate limits entirely so E2E suites can register
// many users in quick succession without tripping the auth limiter.
const isTest = env.NODE_ENV === 'test';

function make(opts: Partial<Options>) {
  return rateLimit({
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => isTest,
    ...opts,
  });
}

export const defaultLimiter = make({ windowMs: 60 * 1000, max: 120 });

export const authLimiter = make({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many auth attempts' } },
});

export const aiLimiter = make({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: { code: 'RATE_LIMITED', message: 'AI rate limit exceeded' } },
});
