import { prisma } from '../../database/prisma/client.js';

export interface DashboardStats {
  users: {
    total: number;
    active: number;
    blocked: number;
    newToday: number;
    newThisWeek: number;
    newThisMonth: number;
  };
  generations: {
    total: number;
    completed: number;
    failed: number;
    pending: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  revenue: {
    totalBalance: number;
    totalDeposits: number;
    totalWithdrawals: number;
    depositsToday: number;
    depositsThisWeek: number;
    depositsThisMonth: number;
  };
  promocodes: {
    total: number;
    active: number;
    totalUsages: number;
    usagesToday: number;
  };
}

export interface TimeSeriesData {
  date: string;
  value: number;
}

export class AdminStatsService {
  async getDashboardStats(): Promise<DashboardStats> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      blockedUsers,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
      activeUsersThisWeek,
      totalGenerations,
      completedGenerations,
      failedGenerations,
      pendingGenerations,
      generationsToday,
      generationsThisWeek,
      generationsThisMonth,
      totalBalanceResult,
      depositsResult,
      withdrawalsResult,
      depositsToday,
      depositsThisWeek,
      depositsThisMonth,
      totalPromocodes,
      activePromocodes,
      totalPromocodeUsages,
      promocodeUsagesToday,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isBlocked: true } }),
      prisma.user.count({ where: { createdAt: { gte: startOfDay } } }),
      prisma.user.count({ where: { createdAt: { gte: startOfWeek } } }),
      prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.user.count({ where: { lastActiveAt: { gte: startOfWeek } } }),

      prisma.generation.count(),
      prisma.generation.count({ where: { status: 'COMPLETED' } }),
      prisma.generation.count({ where: { status: 'FAILED' } }),
      prisma.generation.count({ where: { status: { in: ['PENDING', 'QUEUED', 'PROCESSING'] } } }),
      prisma.generation.count({ where: { createdAt: { gte: startOfDay } } }),
      prisma.generation.count({ where: { createdAt: { gte: startOfWeek } } }),
      prisma.generation.count({ where: { createdAt: { gte: startOfMonth } } }),

      prisma.user.aggregate({ _sum: { balance: true } }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { type: 'DEPOSIT', status: 'COMPLETED' },
      }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { type: 'WITHDRAWAL', status: 'COMPLETED' },
      }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { type: 'DEPOSIT', status: 'COMPLETED', createdAt: { gte: startOfDay } },
      }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { type: 'DEPOSIT', status: 'COMPLETED', createdAt: { gte: startOfWeek } },
      }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { type: 'DEPOSIT', status: 'COMPLETED', createdAt: { gte: startOfMonth } },
      }),

      prisma.promocode.count(),
      prisma.promocode.count({ where: { isActive: true } }),
      prisma.promocodeUsage.count(),
      prisma.promocodeUsage.count({ where: { usedAt: { gte: startOfDay } } }),
    ]);

    return {
      users: {
        total: totalUsers,
        active: activeUsersThisWeek,
        blocked: blockedUsers,
        newToday: newUsersToday,
        newThisWeek: newUsersThisWeek,
        newThisMonth: newUsersThisMonth,
      },
      generations: {
        total: totalGenerations,
        completed: completedGenerations,
        failed: failedGenerations,
        pending: pendingGenerations,
        today: generationsToday,
        thisWeek: generationsThisWeek,
        thisMonth: generationsThisMonth,
      },
      revenue: {
        totalBalance: totalBalanceResult._sum.balance?.toNumber() || 0,
        totalDeposits: depositsResult._sum.amount?.toNumber() || 0,
        totalWithdrawals: Math.abs(withdrawalsResult._sum.amount?.toNumber() || 0),
        depositsToday: depositsToday._sum.amount?.toNumber() || 0,
        depositsThisWeek: depositsThisWeek._sum.amount?.toNumber() || 0,
        depositsThisMonth: depositsThisMonth._sum.amount?.toNumber() || 0,
      },
      promocodes: {
        total: totalPromocodes,
        active: activePromocodes,
        totalUsages: totalPromocodeUsages,
        usagesToday: promocodeUsagesToday,
      },
    };
  }

  async getUsersTimeSeries(days: number = 30): Promise<TimeSeriesData[]> {
    const result: TimeSeriesData[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const count = await prisma.user.count({
        where: {
          createdAt: {
            gte: date,
            lt: nextDate,
          },
        },
      });

      result.push({
        date: date.toISOString().split('T')[0],
        value: count,
      });
    }

    return result;
  }

  async getGenerationsTimeSeries(days: number = 30): Promise<TimeSeriesData[]> {
    const result: TimeSeriesData[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const count = await prisma.generation.count({
        where: {
          createdAt: {
            gte: date,
            lt: nextDate,
          },
        },
      });

      result.push({
        date: date.toISOString().split('T')[0],
        value: count,
      });
    }

    return result;
  }

  async getRevenueTimeSeries(days: number = 30): Promise<TimeSeriesData[]> {
    const result: TimeSeriesData[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const revenue = await prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
          type: 'DEPOSIT',
          status: 'COMPLETED',
          createdAt: {
            gte: date,
            lt: nextDate,
          },
        },
      });

      result.push({
        date: date.toISOString().split('T')[0],
        value: revenue._sum.amount?.toNumber() || 0,
      });
    }

    return result;
  }

  async getApiUsageStats(): Promise<{
    totalRequests: number;
    successRate: number;
    byModel: { model: string; count: number; cost: number }[];
  }> {
    const [totalStats, byModel] = await Promise.all([
      prisma.apiUsage.aggregate({
        _sum: {
          requestCount: true,
          successCount: true,
          failedCount: true,
          totalCost: true,
        },
      }),
      prisma.apiUsage.groupBy({
        by: ['model'],
        _sum: {
          requestCount: true,
          totalCost: true,
        },
      }),
    ]);

    const totalRequests = totalStats._sum.requestCount || 0;
    const successCount = totalStats._sum.successCount || 0;
    const successRate = totalRequests > 0 ? (successCount / totalRequests) * 100 : 0;

    return {
      totalRequests,
      successRate,
      byModel: byModel.map(item => ({
        model: item.model,
        count: item._sum.requestCount || 0,
        cost: item._sum.totalCost?.toNumber() || 0,
      })),
    };
  }
}

export const adminStatsService = new AdminStatsService();
