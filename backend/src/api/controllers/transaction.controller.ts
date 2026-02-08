import { Response } from 'express';
import { prisma } from '../../database/prisma/client.js';
import type { AuthenticatedRequest } from '../middlewares/validate-telegram.middleware.js';
import type { Prisma } from '@prisma/client';

export class TransactionController {
  /**
   * GET /api/transactions
   * Получить историю транзакций пользователя
   */
  async getHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    const user = req.user!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const type = req.query.type as string | undefined;
    const skip = (page - 1) * limit;

    const where: Prisma.TransactionWhereInput = { userId: user.id };

    // Фильтр по типу транзакции
    if (type && ['DEPOSIT', 'WITHDRAWAL', 'REFUND', 'BONUS'].includes(type)) {
      where.type = type as Prisma.TransactionWhereInput['type'];
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          type: true,
          amount: true,
          balanceBefore: true,
          balanceAfter: true,
          status: true,
          description: true,
          createdAt: true,
          completedAt: true,
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        transactions: transactions.map((t) => ({
          ...t,
          amount: Number(t.amount),
          balanceBefore: Number(t.balanceBefore),
          balanceAfter: Number(t.balanceAfter),
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  }
}

export const transactionController = new TransactionController();
