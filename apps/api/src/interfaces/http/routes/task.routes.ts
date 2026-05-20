import { Router } from 'express';
import {
  CreateTaskInputSchema,
  MoveTaskInputSchema,
  ObjectIdSchema,
  UpdateTaskInputSchema,
} from '@ai-task/shared';
import { z } from 'zod';
import type { AppContainer } from '../../../config/container.js';
import { AddCommentUseCase } from '../../../application/use-cases/tasks/AddCommentUseCase.js';
import { AssignTaskUseCase } from '../../../application/use-cases/tasks/AssignTaskUseCase.js';
import { CreateTaskUseCase } from '../../../application/use-cases/tasks/CreateTaskUseCase.js';
import { DeleteTaskUseCase } from '../../../application/use-cases/tasks/DeleteTaskUseCase.js';
import { MoveTaskUseCase } from '../../../application/use-cases/tasks/MoveTaskUseCase.js';
import { UpdateTaskUseCase } from '../../../application/use-cases/tasks/UpdateTaskUseCase.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody, validateParams } from '../middleware/validate.js';

const IdParams = z.object({ id: ObjectIdSchema });
const CommentBody = z.object({ body: z.string().min(1).max(4000) });
const AssignBody = z.object({ assigneeIds: z.array(ObjectIdSchema) });

export function taskRouter(c: AppContainer): Router {
  const router = Router();
  router.use(requireAuth);

  const create = new CreateTaskUseCase(c.tasks, c.boards, c.activity, c.realtime);
  const update = new UpdateTaskUseCase(c.tasks, c.boards, c.activity, c.realtime);
  const move = new MoveTaskUseCase(c.tasks, c.boards, c.activity, c.realtime);
  const del = new DeleteTaskUseCase(c.tasks, c.boards, c.activity, c.realtime);
  const addComment = new AddCommentUseCase(
    c.comments,
    c.tasks,
    c.boards,
    c.activity,
    c.notifications,
    c.realtime,
  );
  const assign = new AssignTaskUseCase(c.tasks, c.boards, c.activity, c.notifications, c.realtime);

  router.post(
    '/',
    validateBody(CreateTaskInputSchema),
    asyncHandler(async (req, res) => {
      res.status(201).json(await create.execute(req.auth!.userId, req.body));
    }),
  );

  router.patch(
    '/:id',
    validateParams(IdParams),
    validateBody(UpdateTaskInputSchema),
    asyncHandler(async (req, res) => {
      res.json(await update.execute(req.auth!.userId, req.params.id, req.body));
    }),
  );

  router.post(
    '/:id/move',
    validateParams(IdParams),
    validateBody(MoveTaskInputSchema),
    asyncHandler(async (req, res) => {
      res.json(await move.execute(req.auth!.userId, req.params.id, req.body));
    }),
  );

  router.delete(
    '/:id',
    validateParams(IdParams),
    asyncHandler(async (req, res) => {
      await del.execute(req.auth!.userId, req.params.id);
      res.status(204).end();
    }),
  );

  router.post(
    '/:id/comments',
    validateParams(IdParams),
    validateBody(CommentBody),
    asyncHandler(async (req, res) => {
      res
        .status(201)
        .json(await addComment.execute(req.auth!.userId, req.params.id, req.body.body));
    }),
  );

  router.post(
    '/:id/assign',
    validateParams(IdParams),
    validateBody(AssignBody),
    asyncHandler(async (req, res) => {
      res.json(await assign.execute(req.auth!.userId, req.params.id, req.body.assigneeIds));
    }),
  );

  return router;
}
