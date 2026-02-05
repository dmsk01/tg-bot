import { Response, NextFunction } from 'express';
import type { AdminRequest } from './admin-auth.middleware.js';
import type { AdminRole } from '@prisma/client';

type Permission =
  | 'manage_admins'
  | 'system_settings'
  | 'create_promocodes'
  | 'change_balance'
  | 'block_users'
  | 'moderation'
  | 'view_data'
  | 'view_logs';

const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  SUPER_ADMIN: [
    'manage_admins',
    'system_settings',
    'create_promocodes',
    'change_balance',
    'block_users',
    'moderation',
    'view_data',
    'view_logs',
  ],
  ADMIN: [
    'create_promocodes',
    'change_balance',
    'block_users',
    'moderation',
    'view_data',
    'view_logs',
  ],
  MODERATOR: [
    'block_users',
    'moderation',
    'view_data',
    'view_logs',
  ],
  SUPPORT: [
    'view_data',
  ],
};

const ROLE_HIERARCHY: Record<AdminRole, number> = {
  SUPER_ADMIN: 4,
  ADMIN: 3,
  MODERATOR: 2,
  SUPPORT: 1,
};

export function hasPermission(role: AdminRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasMinimumRole(role: AdminRole, minimumRole: AdminRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[minimumRole];
}

export function requirePermission(...permissions: Permission[]) {
  return (req: AdminRequest, res: Response, next: NextFunction): void => {
    if (!req.admin) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const hasAllPermissions = permissions.every(permission =>
      hasPermission(req.admin!.role, permission)
    );

    if (!hasAllPermissions) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
      });
      return;
    }

    next();
  };
}

export function requireRole(...roles: AdminRole[]) {
  return (req: AdminRequest, res: Response, next: NextFunction): void => {
    if (!req.admin) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    if (!roles.includes(req.admin.role)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient role',
      });
      return;
    }

    next();
  };
}

export function requireMinimumRole(minimumRole: AdminRole) {
  return (req: AdminRequest, res: Response, next: NextFunction): void => {
    if (!req.admin) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    if (!hasMinimumRole(req.admin.role, minimumRole)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient role level',
      });
      return;
    }

    next();
  };
}
