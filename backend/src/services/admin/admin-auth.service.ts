import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../database/prisma/client.js';
import { configService } from '../../common/config/config.service.js';
import { adminLogService } from './admin-log.service.js';
import type { AdminUser, AdminRole } from '@prisma/client';

const BCRYPT_ROUNDS = 12;

export interface TokenPayload {
  sub: string;
  username: string;
  role: AdminRole;
  type: 'access' | 'refresh';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResult {
  admin: Omit<AdminUser, 'passwordHash'>;
  tokens: AuthTokens;
}

export class AdminAuthService {
  private parseExpiration(exp: string): number {
    const match = exp.match(/^(\d+)([smhd])$/);
    if (!match) return 900; // default 15 minutes

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 60 * 60;
      case 'd': return value * 60 * 60 * 24;
      default: return 900;
    }
  }

  private generateTokens(admin: AdminUser): AuthTokens {
    const secret = configService.admin.jwtSecret;
    const accessExp = this.parseExpiration(configService.admin.jwtAccessExpires);
    const refreshExp = this.parseExpiration(configService.admin.jwtRefreshExpires);

    const accessPayload: TokenPayload = {
      sub: admin.id,
      username: admin.username,
      role: admin.role,
      type: 'access',
    };

    const refreshPayload: TokenPayload = {
      sub: admin.id,
      username: admin.username,
      role: admin.role,
      type: 'refresh',
    };

    const accessToken = jwt.sign(accessPayload, secret, { expiresIn: accessExp });
    const refreshToken = jwt.sign(refreshPayload, secret, { expiresIn: refreshExp });

    return { accessToken, refreshToken };
  }

  verifyToken(token: string): TokenPayload | null {
    try {
      const payload = jwt.verify(token, configService.admin.jwtSecret) as TokenPayload;
      return payload;
    } catch {
      return null;
    }
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async login(
    username: string,
    password: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<LoginResult | null> {
    const admin = await prisma.adminUser.findUnique({
      where: { username: username.toLowerCase() },
    });

    if (!admin || !admin.isActive) {
      return null;
    }

    const passwordValid = await this.comparePassword(password, admin.passwordHash);
    if (!passwordValid) {
      await adminLogService.create({
        adminId: admin.id,
        action: 'LOGIN_FAILED',
        details: { reason: 'Invalid password' },
        ipAddress,
        userAgent,
      });
      return null;
    }

    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    await adminLogService.create({
      adminId: admin.id,
      action: 'LOGIN_SUCCESS',
      ipAddress,
      userAgent,
    });

    const tokens = this.generateTokens(admin);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _passwordHash, ...adminWithoutPassword } = admin;

    return {
      admin: adminWithoutPassword,
      tokens,
    };
  }

  async refresh(refreshToken: string): Promise<AuthTokens | null> {
    const payload = this.verifyToken(refreshToken);
    if (!payload || payload.type !== 'refresh') {
      return null;
    }

    const admin = await prisma.adminUser.findUnique({
      where: { id: payload.sub },
    });

    if (!admin || !admin.isActive) {
      return null;
    }

    return this.generateTokens(admin);
  }

  async getAdminById(id: string): Promise<Omit<AdminUser, 'passwordHash'> | null> {
    const admin = await prisma.adminUser.findUnique({
      where: { id },
    });

    if (!admin) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _passwordHash, ...adminWithoutPassword } = admin;
    return adminWithoutPassword;
  }

  async changePassword(
    adminId: string,
    currentPassword: string,
    newPassword: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<boolean> {
    const admin = await prisma.adminUser.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      return false;
    }

    const passwordValid = await this.comparePassword(currentPassword, admin.passwordHash);
    if (!passwordValid) {
      await adminLogService.create({
        adminId,
        action: 'PASSWORD_CHANGE_FAILED',
        details: { reason: 'Invalid current password' },
        ipAddress,
        userAgent,
      });
      return false;
    }

    const newPasswordHash = await this.hashPassword(newPassword);

    await prisma.adminUser.update({
      where: { id: adminId },
      data: { passwordHash: newPasswordHash },
    });

    await adminLogService.create({
      adminId,
      action: 'PASSWORD_CHANGED',
      ipAddress,
      userAgent,
    });

    return true;
  }

  async createAdmin(
    username: string,
    password: string,
    role: AdminRole,
    firstName?: string,
    lastName?: string,
    createdByAdminId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<Omit<AdminUser, 'passwordHash'>> {
    const passwordHash = await this.hashPassword(password);

    const admin = await prisma.adminUser.create({
      data: {
        username: username.toLowerCase(),
        passwordHash,
        role,
        firstName,
        lastName,
      },
    });

    if (createdByAdminId) {
      await adminLogService.create({
        adminId: createdByAdminId,
        action: 'CREATE_ADMIN',
        entityType: 'AdminUser',
        entityId: admin.id,
        details: { username: admin.username, role: admin.role },
        ipAddress,
        userAgent,
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _passwordHash, ...adminWithoutPassword } = admin;
    return adminWithoutPassword;
  }
}

export const adminAuthService = new AdminAuthService();
