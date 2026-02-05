import { Response } from 'express';
import { z } from 'zod';
import { adminStatsService } from '../../../services/admin/admin-stats.service.js';
import type { AdminRequest } from '../middlewares/admin-auth.middleware.js';

const timeSeriesSchema = z.object({
  days: z.coerce.number().int().positive().max(365).optional().default(30),
});

export class AdminStatsController {
  async getDashboard(req: AdminRequest, res: Response): Promise<void> {
    const stats = await adminStatsService.getDashboardStats();

    res.json({
      success: true,
      data: stats,
    });
  }

  async getUsersStats(req: AdminRequest, res: Response): Promise<void> {
    const { days } = timeSeriesSchema.parse(req.query);
    const timeSeries = await adminStatsService.getUsersTimeSeries(days);

    res.json({
      success: true,
      data: { timeSeries },
    });
  }

  async getGenerationsStats(req: AdminRequest, res: Response): Promise<void> {
    const { days } = timeSeriesSchema.parse(req.query);
    const timeSeries = await adminStatsService.getGenerationsTimeSeries(days);

    res.json({
      success: true,
      data: { timeSeries },
    });
  }

  async getRevenueStats(req: AdminRequest, res: Response): Promise<void> {
    const { days } = timeSeriesSchema.parse(req.query);
    const timeSeries = await adminStatsService.getRevenueTimeSeries(days);

    res.json({
      success: true,
      data: { timeSeries },
    });
  }

  async getApiUsageStats(req: AdminRequest, res: Response): Promise<void> {
    const stats = await adminStatsService.getApiUsageStats();

    res.json({
      success: true,
      data: stats,
    });
  }
}

export const adminStatsController = new AdminStatsController();
