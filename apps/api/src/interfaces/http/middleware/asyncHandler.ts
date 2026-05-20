import type { NextFunction, Request, RequestHandler, Response } from 'express';

// Wrap async route handlers so rejected promises forward to errorHandler.
// Avoids try/catch boilerplate in every controller. Express 5 makes this
// implicit; we're on 4.x, so we still need it.
type AsyncRouteHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

export const asyncHandler = (fn: AsyncRouteHandler): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
