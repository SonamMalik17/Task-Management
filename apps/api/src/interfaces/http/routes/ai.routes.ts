import { Router } from 'express';
import {
  ObjectIdSchema,
  ParseNaturalLanguageInputSchema,
  RecommendDeadlineInputSchema,
  SuggestTasksInputSchema,
} from '@ai-task/shared';
import { z } from 'zod';
import type { AppContainer } from '../../../config/container.js';
import { ParseNaturalLanguageUseCase } from '../../../application/use-cases/ai/ParseNaturalLanguageUseCase.js';
import { RecommendDeadlineUseCase } from '../../../application/use-cases/ai/RecommendDeadlineUseCase.js';
import { SuggestTasksUseCase } from '../../../application/use-cases/ai/SuggestTasksUseCase.js';
import { SummarizeTaskUseCase } from '../../../application/use-cases/ai/SummarizeTaskUseCase.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { aiLimiter } from '../middleware/rateLimit.js';
import { validateBody, validateParams } from '../middleware/validate.js';

const TaskIdParams = z.object({ id: ObjectIdSchema });

export function aiRouter(c: AppContainer): Router {
  const router = Router();
  router.use(requireAuth, aiLimiter);

  const parseNL = new ParseNaturalLanguageUseCase(c.boards, c.ai);
  const summarize = new SummarizeTaskUseCase(c.tasks, c.comments, c.boards, c.ai);
  const recommend = new RecommendDeadlineUseCase(c.ai);
  const suggest = new SuggestTasksUseCase(c.boards, c.tasks, c.ai);

  router.post(
    '/parse-task',
    validateBody(ParseNaturalLanguageInputSchema),
    asyncHandler(async (req, res) => {
      res.json(await parseNL.execute(req.auth!.userId, req.body));
    }),
  );

  router.post(
    '/summarize-task/:id',
    validateParams(TaskIdParams),
    asyncHandler(async (req, res) => {
      res.json(await summarize.execute(req.auth!.userId, req.params.id!));
    }),
  );

  router.post(
    '/recommend-deadline',
    validateBody(RecommendDeadlineInputSchema),
    asyncHandler(async (req, res) => {
      res.json(await recommend.execute(req.body));
    }),
  );

  router.post(
    '/suggest-tasks',
    validateBody(SuggestTasksInputSchema),
    asyncHandler(async (req, res) => {
      res.json(await suggest.execute(req.auth!.userId, req.body));
    }),
  );

  return router;
}
