import { Router } from 'express';
import { ObjectIdSchema } from '@ai-task/shared';
import { z } from 'zod';
import type { AppContainer } from '../../../config/container.js';
import { ListActivityUseCase } from '../../../application/use-cases/activity/ListActivityUseCase.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { validateParams, validateQuery } from '../middleware/validate.js';

const BoardParams = z.object({ boardId: ObjectIdSchema });
const Query = z.object({ limit: z.coerce.number().int().min(1).max(200).default(50) });

export function activityRouter(c: AppContainer): Router {
  const router = Router();
  router.use(requireAuth);
  const list = new ListActivityUseCase(c.activity, c.boards);

  router.get(
    '/board/:boardId',
    validateParams(BoardParams),
    validateQuery(Query),
    asyncHandler(async (req, res) => {
      const { limit } = req.query as unknown as { limit: number };
      res.json(await list.execute(req.auth!.userId, req.params.boardId!, limit));
    }),
  );

  return router;
}
