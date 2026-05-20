import { Router } from 'express';
import { LoginInputSchema, RegisterInputSchema } from '@ai-task/shared';
import { z } from 'zod';
import type { AppContainer } from '../../../config/container.js';
import { LoginUseCase } from '../../../application/use-cases/auth/LoginUseCase.js';
import { RefreshTokenUseCase } from '../../../application/use-cases/auth/RefreshTokenUseCase.js';
import { RegisterUseCase } from '../../../application/use-cases/auth/RegisterUseCase.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { validateBody } from '../middleware/validate.js';

const RefreshSchema = z.object({ refreshToken: z.string().min(10) });

export function authRouter(c: AppContainer): Router {
  const router = Router();
  const register = new RegisterUseCase(c.users, c.hasher, c.tokens);
  const login = new LoginUseCase(c.users, c.hasher, c.tokens);
  const refresh = new RefreshTokenUseCase(c.users, c.tokens);

  router.post(
    '/register',
    authLimiter,
    validateBody(RegisterInputSchema),
    asyncHandler(async (req, res) => {
      const result = await register.execute(req.body);
      res.status(201).json(result);
    }),
  );

  router.post(
    '/login',
    authLimiter,
    validateBody(LoginInputSchema),
    asyncHandler(async (req, res) => {
      const result = await login.execute(req.body);
      res.json(result);
    }),
  );

  router.post(
    '/refresh',
    validateBody(RefreshSchema),
    asyncHandler(async (req, res) => {
      const result = await refresh.execute(req.body.refreshToken);
      res.json(result);
    }),
  );

  return router;
}
