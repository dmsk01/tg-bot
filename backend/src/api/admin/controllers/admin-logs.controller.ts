import { Response } from 'express';
import { z } from 'zod';
import { adminLogService } from '../../../services/admin/admin-log.service.js';
import type { AdminRequest } from '../middlewares/admin-auth.middleware.js';

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
});

const logFiltersSchema = z.object({
  adminId: z.string().uuid().optional(),
  action: z.string().optional(),
  entityType: z.string().optional(),
  startDate: z.string().datetime().optional().transform(v => v ? new Date(v) : undefined),
  endDate: z.string().datetime().optional().transform(v => v ? new Date(v) : undefined),
});

export class AdminLogsController {
  async getLogs(req: AdminRequest, res: Response): Promise<void> {
    const pagination = paginationSchema.parse(req.query);
    const filters = logFiltersSchema.parse(req.query);

    const { logs, total } = await adminLogService.findMany(filters, pagination);

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

  async getLog(req: AdminRequest, res: Response): Promise<void> {
    const { id } = req.params;

    const log = await adminLogService.findById(id);

    if (!log) {
      res.status(404).json({
        success: false,
        error: 'Log not found',
      });
      return;
    }

    res.json({
      success: true,
      data: log,
    });
  }
}

export const adminLogsController = new AdminLogsController();
