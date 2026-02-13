import { Response } from 'express';
import { z } from 'zod';
import { adminUsersService } from '../../../services/admin/admin-users.service.js';
import { adminAuthService } from '../../../services/admin/admin-auth.service.js';
import { adminLogService } from '../../../services/admin/admin-log.service.js';
import { exportService } from '../../../services/admin/export.service.js';
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

const exportFormatSchema = z.object({
  format: z.enum(['csv', 'xlsx']).optional().default('csv'),
});

const passwordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

const createAdminSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: passwordSchema,
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

  async getUserLogs(req: AdminRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const pagination = paginationSchema.parse(req.query);

    const { logs, total } = await adminLogService.findMany(
      { entityType: 'User', entityId: id },
      { page: pagination.page, limit: pagination.limit }
    );

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          totalPages: Math.ceil(total / pagination.limit),
        },
      },
    });
  }

  async exportUserGenerations(req: AdminRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const { format } = exportFormatSchema.parse(req.query);

    const { generations } = await adminUsersService.getUserGenerations(id, { page: 1, limit: 10000 });

    const columns = [
      { key: 'id', header: 'ID', width: 36 },
      { key: 'createdAt', header: 'Date', width: 20 },
      { key: 'generationType', header: 'Type', width: 15 },
      { key: 'model', header: 'Model', width: 20 },
      { key: 'prompt', header: 'Prompt', width: 50 },
      { key: 'status', header: 'Status', width: 12 },
      { key: 'cost', header: 'Cost', width: 10 },
    ];

    const data = generations.map(g => {
      const gen = g as Record<string, unknown>;
      return {
        id: gen.id,
        createdAt: new Date(gen.createdAt as string).toISOString(),
        generationType: gen.generationType,
        model: gen.model,
        prompt: gen.prompt,
        status: gen.status,
        cost: Number(gen.cost).toFixed(2),
      };
    });

    if (format === 'xlsx') {
      const buffer = await exportService.exportToExcel(data, columns, 'Generations');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=user-${id}-generations.xlsx`);
      res.send(buffer);
    } else {
      const csv = exportService.exportToCsv(data, columns);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=user-${id}-generations.csv`);
      res.send(csv);
    }
  }

  async exportUserTransactions(req: AdminRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const { format } = exportFormatSchema.parse(req.query);

    const { transactions } = await adminUsersService.getUserTransactions(id, { page: 1, limit: 10000 });

    const columns = [
      { key: 'id', header: 'ID', width: 36 },
      { key: 'createdAt', header: 'Date', width: 20 },
      { key: 'type', header: 'Type', width: 12 },
      { key: 'amount', header: 'Amount', width: 12 },
      { key: 'balanceBefore', header: 'Balance Before', width: 15 },
      { key: 'balanceAfter', header: 'Balance After', width: 15 },
      { key: 'status', header: 'Status', width: 12 },
      { key: 'description', header: 'Description', width: 30 },
    ];

    const data = transactions.map(t => {
      const tx = t as Record<string, unknown>;
      return {
        id: tx.id,
        createdAt: new Date(tx.createdAt as string).toISOString(),
        type: tx.type,
        amount: Number(tx.amount).toFixed(2),
        balanceBefore: Number(tx.balanceBefore).toFixed(2),
        balanceAfter: Number(tx.balanceAfter).toFixed(2),
        status: tx.status,
        description: tx.description || '',
      };
    });

    if (format === 'xlsx') {
      const buffer = await exportService.exportToExcel(data, columns, 'Transactions');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=user-${id}-transactions.xlsx`);
      res.send(buffer);
    } else {
      const csv = exportService.exportToCsv(data, columns);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=user-${id}-transactions.csv`);
      res.send(csv);
    }
  }

  async exportUserLogs(req: AdminRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const { format } = exportFormatSchema.parse(req.query);

    const { logs } = await adminLogService.findMany(
      { entityType: 'User', entityId: id },
      { page: 1, limit: 10000 }
    );

    const columns = [
      { key: 'id', header: 'ID', width: 36 },
      { key: 'createdAt', header: 'Date', width: 20 },
      { key: 'adminUsername', header: 'Admin', width: 20 },
      { key: 'action', header: 'Action', width: 20 },
      { key: 'details', header: 'Details', width: 50 },
    ];

    const data = logs.map(l => ({
      id: l.id,
      createdAt: new Date(l.createdAt).toISOString(),
      adminUsername: (l as { admin?: { username?: string } }).admin?.username || '-',
      action: l.action,
      details: l.details ? JSON.stringify(l.details) : '',
    }));

    if (format === 'xlsx') {
      const buffer = await exportService.exportToExcel(data, columns, 'Admin Logs');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=user-${id}-logs.xlsx`);
      res.send(buffer);
    } else {
      const csv = exportService.exportToCsv(data, columns);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=user-${id}-logs.csv`);
      res.send(csv);
    }
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
