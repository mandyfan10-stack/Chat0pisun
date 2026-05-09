import type { ErrorRequestHandler, NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export class HttpError extends Error {
  statusCode: number;
  code: string;
  details?: unknown;

  constructor(statusCode: number, message: string, code = 'ERROR', details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

export const asyncHandler =
  (handler: AsyncHandler) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof HttpError) {
    return res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    });
  }

  // Log unexpected errors
  logger.error(error, '[Unhandled Error]');

  return res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: env.nodeEnv === 'production' ? 'Internal server error' : (error instanceof Error ? error.message : 'Internal server error'),
    },
  });
};
