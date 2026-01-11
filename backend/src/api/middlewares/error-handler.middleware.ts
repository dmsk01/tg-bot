import { Request, Response, NextFunction } from 'express';
import { logger } from '../../common/utils/logger.util.js';

export interface ApiError extends Error {
  statusCode?: number;
  details?: unknown;
}

export function errorHandler(
  err: ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  logger.error(`API Error: ${message}`, {
    statusCode,
    path: req.path,
    method: req.method,
    error: err,
  });

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
