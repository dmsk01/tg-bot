import { Request, Response, NextFunction } from 'express';
import { adminAuthService } from '../../../services/admin/admin-auth.service.js';
import { logger } from '../../../common/utils/logger.util.js';
import type { AdminUser, AdminRole } from '@prisma/client';

export interface AdminRequest extends Request {
  admin?: Omit<AdminUser, 'passwordHash'>;
  adminId?: string;
}

export function extractClientInfo(req: Request): { ipAddress: string; userAgent: string } {
  const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
    || req.socket.remoteAddress
    || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  return { ipAddress, userAgent };
}

export async function authenticateAdmin(
  req: AdminRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Missing or invalid authorization header',
      });
      return;
    }

    const token = authHeader.substring(7);
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
