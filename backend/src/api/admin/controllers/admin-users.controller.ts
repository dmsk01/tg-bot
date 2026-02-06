import { Response } from 'express';
import { z } from 'zod';
import { adminUsersService } from '../../../services/admin/admin-users.service.js';
import { adminAuthService } from '../../../services/admin/admin-auth.service.js';
import type { AdminRequest } from '../middlewares/admin-auth.middleware.js';
import { extractClientInfo } from '../middlewares/admin-auth.middleware.js';

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  sortBy: z.enum(['createdAt', 'balance', 'lastActiveAt']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

const userFiltersSchema = z.object({
  search: z.string().optional(),
  isBlocked: z.enum(['true', 'false']).optional().transform(v => v === 'true' ? true : v === 'false' ? false : undefined),
  isAdmin: z.enum(['true', 'false']).optional().transform(v => v === 'true' ? true : v === 'false' ? false : undefined),
  minBalance: z.coerce.number().optional(),
  maxBalance: z.coerce.number().optional(),
});

const updateUserSchema = z.object({
  isBlocked: z.boolean().optional(),
  isAdmin: z.boolean().optional(),
});

const changeBalanceSchema = z.object({
  amount: z.number(),
  reason: z.string().min(1, 'Reason is required'),
});

const createAdminSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'SUPPORT']),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

const updateAdminSchema = z.object({
  isActive: z.boolean().optional(),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'SUPPORT']).optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export class AdminUsersController {
  async getUsers(req: AdminRequest, res: Response): Promise<void> {
    const pagination = paginationSchema.parse(req.query);
    const filters = userFiltersSchema.parse(req.query);

    const { users, total } = await adminUsersService.findMany(filters, pagination);

    res.json({
      success: true,
      data: {
        users: users.map(user => ({
          ...user,
          telegramId: user.telegramId.toString(),
          balance: user.balance.toNumber(),
        })),
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          totalPages: Math.ceil(total / pagination.limit),
        },
      },
    });
  }

  async getUser(req: AdminRequest, res: Response): Promise<void> {
    const { id } = req.params;

    const user = await adminUsersService.findById(id);

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        ...user,
        telegramId: user.telegramId.toString(),
        balance: user.balance.toNumber(),
      },
    });
  }

  async updateUser(req: AdminRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const validation = updateUserSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.error.errors,
      });
      return;
    }

    const { ipAddress, userAgent } = extractClientInfo(req);

    const user = await adminUsersService.update(
      id,
      validation.data,
      req.admin!.id,
      ipAddress,
      userAgent
    );

    res.json({
      success: true,
      data: {
        ...user,
        telegramId: user.telegramId.toString(),
        balance: user.balance.toNumber(),
      },
    });
  }

  async changeBalance(req: AdminRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const validation = changeBalanceSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.error.errors,
      });
      return;
    }

    const { ipAddress, userAgent } = extractClientInfo(req);

    try {
      const user = await adminUsersService.changeBalance({
        userId: id,
        amount: validation.data.amount,
        reason: validation.data.reason,
        adminId: req.admin!.id,
        ipAddress,
        userAgent,
      });

      res.json({
        success: true,
        data: {
          ...user,
          telegramId: user.telegramId.toString(),
          balance: user.balance.toNumber(),
        },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to change balance',
      });
    }
  }

  async getUserTransactions(req: AdminRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const pagination = paginationSchema.parse(req.query);

    const { transactions, total } = await adminUsersService.getUserTransactions(id, pagination);

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          totalPages: Math.ceil(total / pagination.limit),
        },
      },
    });
  }

  async getUserGenerations(req: AdminRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const pagination = paginationSchema.parse(req.query);

    const { generations, total } = await adminUsersService.getUserGenerations(id, pagination);

    res.json({
      success: true,
      data: {
        generations,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          totalPages: Math.ceil(total / pagination.limit),
        },
      },
    });
  }

  async deleteUser(req: AdminRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const { ipAddress, userAgent } = extractClientInfo(req);

    try {
      await adminUsersService.deleteUser(id, req.admin!.id, ipAddress, userAgent);

      res.json({
        success: true,
        message: 'User blocked successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete user',
      });
    }
  }

  async getAdmins(req: AdminRequest, res: Response): Promise<void> {
    const pagination = paginationSchema.parse(req.query);

    const { admins, total } = await adminUsersService.getAdminList(pagination);

    res.json({
      success: true,
      data: {
        admins,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          totalPages: Math.ceil(total / pagination.limit),
        },
      },
    });
  }

  async createAdmin(req: AdminRequest, res: Response): Promise<void> {
    const validation = createAdminSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.error.errors,
      });
      return;
    }

    const { username, password, role, firstName, lastName } = validation.data;
    const { ipAddress, userAgent } = extractClientInfo(req);

    try {
      const admin = await adminAuthService.createAdmin(
        username,
        password,
        role,
        firstName,
        lastName,
        req.admin!.id,
        ipAddress,
        userAgent
      );

      res.status(201).json({
        success: true,
        data: admin,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create admin',
      });
    }
  }

  async updateAdmin(req: AdminRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const validation = updateAdminSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.error.errors,
      });
      return;
    }

    const { ipAddress, userAgent } = extractClientInfo(req);

    try {
      const admin = await adminUsersService.updateAdmin(
        id,
        validation.data,
        req.admin!.id,
        ipAddress,
        userAgent
      );

      res.json({
        success: true,
        data: admin,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update admin',
      });
    }
  }

  async deleteAdmin(req: AdminRequest, res: Response): Promise<void> {
    const { id } = req.params;

    if (id === req.admin!.id) {
      res.status(400).json({
        success: false,
        error: 'Cannot deactivate your own account',
      });
      return;
    }

    const { ipAddress, userAgent } = extractClientInfo(req);

    try {
      const admin = await adminUsersService.updateAdmin(
        id,
        { isActive: false },
        req.admin!.id,
        ipAddress,
        userAgent
      );

      res.json({
        success: true,
        data: admin,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to deactivate admin',
      });
    }
  }
}

export const adminUsersController = new AdminUsersController();
