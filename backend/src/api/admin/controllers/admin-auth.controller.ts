import { Request, Response } from 'express';
import { z } from 'zod';
import { adminAuthService } from '../../../services/admin/admin-auth.service.js';
import { adminLogService } from '../../../services/admin/admin-log.service.js';
import type { AdminRequest } from '../middlewares/admin-auth.middleware.js';
import { extractClientInfo } from '../middlewares/admin-auth.middleware.js';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export class AdminAuthController {
  async login(req: Request, res: Response): Promise<void> {
    const validation = loginSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.error.errors,
      });
      return;
    }

    const { username, password } = validation.data;
    const { ipAddress, userAgent } = extractClientInfo(req);

    const result = await adminAuthService.login(username, password, ipAddress, userAgent);

    if (!result) {
      res.status(401).json({
        success: false,
        error: 'Invalid username or password',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        admin: result.admin,
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
      },
    });
  }

  async logout(req: AdminRequest, res: Response): Promise<void> {
    if (req.admin) {
      const { ipAddress, userAgent } = extractClientInfo(req);

      await adminLogService.create({
        adminId: req.admin.id,
        action: 'LOGOUT',
        ipAddress,
        userAgent,
      });
    }

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  }

  async refresh(req: Request, res: Response): Promise<void> {
    const validation = refreshSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.error.errors,
      });
      return;
    }

    const { refreshToken } = validation.data;
    const tokens = await adminAuthService.refresh(refreshToken);

    if (!tokens) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired refresh token',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });
  }

  async me(req: AdminRequest, res: Response): Promise<void> {
    res.json({
      success: true,
      data: req.admin,
    });
  }

  async changePassword(req: AdminRequest, res: Response): Promise<void> {
    const validation = changePasswordSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.error.errors,
      });
      return;
    }

    const { currentPassword, newPassword } = validation.data;
    const { ipAddress, userAgent } = extractClientInfo(req);

    const success = await adminAuthService.changePassword(
      req.admin!.id,
      currentPassword,
      newPassword,
      ipAddress,
      userAgent
    );

    if (!success) {
      res.status(400).json({
        success: false,
        error: 'Current password is incorrect',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  }
}

export const adminAuthController = new AdminAuthController();
