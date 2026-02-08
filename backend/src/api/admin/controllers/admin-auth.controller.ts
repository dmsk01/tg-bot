import { Request, Response, CookieOptions } from 'express';
import { z } from 'zod';
import { adminAuthService } from '../../../services/admin/admin-auth.service.js';
import { adminLogService } from '../../../services/admin/admin-log.service.js';
import { configService } from '../../../common/config/config.service.js';
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

// Cookie configuration
const ACCESS_TOKEN_COOKIE = 'admin_access_token';
const REFRESH_TOKEN_COOKIE = 'admin_refresh_token';

function getCookieOptions(maxAge: number): CookieOptions {
  return {
    httpOnly: true,
    secure: configService.isProduction,
    sameSite: 'strict',
    path: '/',
    maxAge,
  };
}

function setTokenCookies(res: Response, accessToken: string, refreshToken: string): void {
  // Access token: 15 minutes
  res.cookie(ACCESS_TOKEN_COOKIE, accessToken, getCookieOptions(15 * 60 * 1000));
  // Refresh token: 7 days
  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000));
}

function clearTokenCookies(res: Response): void {
  res.clearCookie(ACCESS_TOKEN_COOKIE, { path: '/' });
  res.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/' });
}

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

    // Set tokens in httpOnly cookies
    setTokenCookies(res, result.tokens.accessToken, result.tokens.refreshToken);

    res.json({
      success: true,
      data: {
        admin: result.admin,
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

    // Clear httpOnly cookies
    clearTokenCookies(res);

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  }

  async refresh(req: Request, res: Response): Promise<void> {
    // Read refresh token from httpOnly cookie
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];

    if (!refreshToken) {
      res.status(401).json({
        success: false,
        error: 'No refresh token provided',
      });
      return;
    }

    const tokens = await adminAuthService.refresh(refreshToken);

    if (!tokens) {
      // Clear invalid cookies
      clearTokenCookies(res);
      res.status(401).json({
        success: false,
        error: 'Invalid or expired refresh token',
      });
      return;
    }

    // Set new tokens in httpOnly cookies
    setTokenCookies(res, tokens.accessToken, tokens.refreshToken);

    res.json({
      success: true,
      message: 'Tokens refreshed successfully',
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
