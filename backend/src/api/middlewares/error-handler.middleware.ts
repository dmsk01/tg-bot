import { Request, Response, NextFunction } from 'express';
import { logger } from '../../common/utils/logger.util.js';
import { configService } from '../../common/config/config.service.js';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;
}

// Map of safe error messages to show to users
const SAFE_ERROR_MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: 'Invalid credentials',
  USER_NOT_FOUND: 'User not found',
  VALIDATION_ERROR: 'Invalid input data',
  UNAUTHORIZED: 'Unauthorized',
  FORBIDDEN: 'Access denied',
  NOT_FOUND: 'Resource not found',
  INSUFFICIENT_BALANCE: 'Insufficient balance',
  RATE_LIMIT_EXCEEDED: 'Too many requests',
  INVALID_TOKEN: 'Invalid or expired token',
  PROMOCODE_NOT_FOUND: 'Promocode not found',
  PROMOCODE_EXPIRED: 'Promocode has expired',
  PROMOCODE_ALREADY_USED: 'Promocode already used',
};

// Error messages that are safe to pass through to clients
const SAFE_ERROR_PATTERNS = [
  /^Invalid/i,
  /^Missing/i,
  /^Promocode/i,
  /^Insufficient balance/i,
  /^User not found/i,
  /^Generation not found/i,
  /^Template not found/i,
];

function getSafeErrorMessage(err: ApiError): string {
  // If error has a known code, use the safe message
  if (err.code && SAFE_ERROR_MESSAGES[err.code]) {
    return SAFE_ERROR_MESSAGES[err.code];
  }

  // Check if the message matches safe patterns
  const message = err.message || '';
  const isSafeMessage = SAFE_ERROR_PATTERNS.some((pattern) =>
    pattern.test(message)
  );

  if (isSafeMessage) {
    return message;
  }

  // For 4xx errors, the message is usually safe
  if (err.statusCode && err.statusCode >= 400 && err.statusCode < 500) {
    return message;
  }

  // For 5xx errors, return generic message
  return 'An error occurred';
}

export function errorHandler(
  err: ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || 500;

  // Log full error details server-side
  logger.error(`API Error: ${err.message}`, {
    statusCode,
    code: err.code,
    path: req.path,
    method: req.method,
    error: err,
  });

  // Return safe message to client
  const safeMessage = getSafeErrorMessage(err);

  res.status(statusCode).json({
    success: false,
    error: safeMessage,
    ...(err.code && { code: err.code }),
    ...(configService.isDevelopment && { stack: err.stack }),
  });
}
