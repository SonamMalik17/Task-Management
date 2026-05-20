import type { RequestHandler } from 'express';
import { type ZodTypeAny } from 'zod';

// Validates and ASSIGNS parsed data back to the request. Downstream handlers
// can then trust `req.body`, `req.query`, `req.params` as fully typed/coerced.
export const validateBody = (schema: ZodTypeAny): RequestHandler => (req, _res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) return next(result.error);
  req.body = result.data;
  next();
};

export const validateQuery = (schema: ZodTypeAny): RequestHandler => (req, _res, next) => {
  const result = schema.safeParse(req.query);
  if (!result.success) return next(result.error);
  (req as { query: unknown }).query = result.data;
  next();
};

export const validateParams = (schema: ZodTypeAny): RequestHandler => (req, _res, next) => {
  const result = schema.safeParse(req.params);
  if (!result.success) return next(result.error);
  (req as { params: unknown }).params = result.data;
  next();
};
