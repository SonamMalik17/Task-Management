import { Router } from 'express';
import { ObjectIdSchema } from '@ai-task/shared';
import { z } from 'zod';
import type { AppContainer } from '../../../config/container.js';
import { ListNotificationsUseCase } from '../../../application/use-cases/notifications/ListNotificationsUseCase.js';
import { MarkNotificationReadUseCase } from '../../../application/use-cases/notifications/MarkNotificationReadUseCase.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { validateParams, validateQuery } from '../middleware/validate.js';

const IdParams = z.object({ id: ObjectIdSchema });
const Query = z.object({ unreadOnly: z.coerce.boolean().default(false) });

export function notificationRouter(c: AppContainer): Router {
  const router = Router();
  router.use(requireAuth);
  const list = new ListNotificationsUseCase(c.notifications);
  const mark = new MarkNotificationReadUseCase(c.notifications);

  router.get(
    '/',
    validateQuery(Query),
    asyncHandler(async (req, res) => {
      const { unreadOnly } = req.query as unknown as { unreadOnly: boolean };
      res.json(await list.execute(req.auth!.userId, unreadOnly));
    }),
  );

  router.post(
    '/:id/read',
    validateParams(IdParams),
    asyncHandler(async (req, res) => {
      res.json(await mark.execute(req.auth!.userId, req.params.id));
    }),
  );

  router.post(
    '/read-all',
    asyncHandler(async (req, res) => {
      await mark.executeAll(req.auth!.userId);
      res.status(204).end();
    }),
  );

  return router;
}
