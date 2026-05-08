import type { ErrorRequestHandler, NextFunction, Request, Response } from 'express';
import { env } from '../config/env';

export class HttpError extends Error {
  statusCode: number;
  code: string;

  constructor(statusCode: number, message: string, code = 'ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
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
      },
    });
  }

  // Log unexpected errors
  console.error('[Unhandled Error]:', {
    message: error instanceof Error ? error.message : 'Unknown error',
    stack: env.nodeEnv === 'development' && error instanceof Error ? error.stack : undefined,
  });

  return res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: env.nodeEnv === 'production' ? 'Internal server error' : (error instanceof Error ? error.message : 'Internal server error'),
    },
  });
};
