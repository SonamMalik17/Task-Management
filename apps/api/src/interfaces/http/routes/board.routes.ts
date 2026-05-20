import { Router } from 'express';
import { CreateBoardInputSchema, InviteMemberInputSchema, ObjectIdSchema } from '@ai-task/shared';
import { z } from 'zod';
import type { AppContainer } from '../../../config/container.js';
import { CreateBoardUseCase } from '../../../application/use-cases/boards/CreateBoardUseCase.js';
import { GetBoardUseCase } from '../../../application/use-cases/boards/GetBoardUseCase.js';
import { InviteMemberUseCase } from '../../../application/use-cases/boards/InviteMemberUseCase.js';
import { ListBoardsUseCase } from '../../../application/use-cases/boards/ListBoardsUseCase.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody, validateParams } from '../middleware/validate.js';

const IdParams = z.object({ id: ObjectIdSchema });

export function boardRouter(c: AppContainer): Router {
  const router = Router();
  router.use(requireAuth);

  const createBoard = new CreateBoardUseCase(c.boards, c.activity);
  const getBoard = new GetBoardUseCase(c.boards, c.tasks);
  const listBoards = new ListBoardsUseCase(c.boards);
  const invite = new InviteMemberUseCase(c.boards, c.users, c.activity, c.notifications, c.realtime);

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      res.json(await listBoards.execute(req.auth!.userId));
    }),
  );

  router.post(
    '/',
    validateBody(CreateBoardInputSchema),
    asyncHandler(async (req, res) => {
      const result = await createBoard.execute(req.auth!.userId, req.body);
      res.status(201).json(result);
    }),
  );

  router.get(
    '/:id',
    validateParams(IdParams),
    asyncHandler(async (req, res) => {
      res.json(await getBoard.execute(req.auth!.userId, req.params.id));
    }),
  );

  router.post(
    '/:id/members',
    validateParams(IdParams),
    validateBody(InviteMemberInputSchema),
    asyncHandler(async (req, res) => {
      res.status(201).json(await invite.execute(req.auth!.userId, req.params.id, req.body));
    }),
  );

  return router;
}
