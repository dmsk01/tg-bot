import rateLimit from 'express-rate-limit';
import type { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user?: { id: string };
}

/**
 * Rate limiter for generation endpoint
 * Limits to 5 generation requests per minute per user
 */
export const generationRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per window
  keyGenerator: (req) => {
    const authReq = req as AuthenticatedRequest;
    return authReq.user?.id || req.ip || 'unknown';
  },
  message: {
    success: false,
    error: 'Too many generation requests. Please wait a minute before trying again.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
