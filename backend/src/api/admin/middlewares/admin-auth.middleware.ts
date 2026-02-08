import { Request, Response, NextFunction } from 'express';
import { adminAuthService } from '../../../services/admin/admin-auth.service.js';
import { logger } from '../../../common/utils/logger.util.js';
import type { AdminUser } from '@prisma/client';

const ACCESS_TOKEN_COOKIE = 'admin_access_token';

export interface AdminRequest extends Request {
  admin?: Omit<AdminUser, 'passwordHash'>;
  adminId?: string;
}

export function extractClientInfo(req: Request): { ipAddress: string; userAgent: string } {
  const ipAddress =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket.remoteAddress ||
    'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  return { ipAddress, userAgent };
}

export async function authenticateAdmin(
  req: AdminRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Read access token from httpOnly cookie
    const token = req.cookies?.[ACCESS_TOKEN_COOKIE];

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Missing authentication token',
      });
      return;
    }

    const payload = adminAuthService.verifyToken(token);

    if (!payload) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
      });
      return;
    }

    if (payload.type !== 'access') {
      res.status(401).json({
        success: false,
        error: 'Invalid token type',
      });
      return;
    }

    const admin = await adminAuthService.getAdminById(payload.sub);

    if (!admin) {
      res.status(401).json({
        success: false,
        error: 'Admin not found',
      });
      return;
    }

    if (!admin.isActive) {
      res.status(403).json({
        success: false,
        error: 'Admin account is deactivated',
      });
      return;
    }

    req.admin = admin;
    req.adminId = admin.id;

    next();
  } catch (error) {
    logger.error('Admin authentication error:', error);
    res.status(401).json({
      success: false,
      error: 'Authentication failed',
    });
  }
}
