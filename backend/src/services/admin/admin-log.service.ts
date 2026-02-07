import { prisma } from '../../database/prisma/client.js';
import type { AdminLog, Prisma } from '@prisma/client';

export interface CreateLogParams {
  adminId: string;
  action: string;
  entityType?: string;
  entityId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export interface LogFilters {
  adminId?: string;
  action?: string;
  entityType?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export class AdminLogService {
  async create(params: CreateLogParams): Promise<AdminLog> {
    return prisma.adminLog.create({
      data: {
        adminId: params.adminId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        details: params.details as Prisma.InputJsonValue,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  }

  async findMany(
    filters: LogFilters = {},
    pagination: PaginationParams = {}
  ): Promise<{ logs: AdminLog[]; total: number }> {
    const { page = 1, limit = 50 } = pagination;
    const skip = (page - 1) * limit;

    const where: Prisma.AdminLogWhereInput = {};

    if (filters.adminId) {
      where.adminId = filters.adminId;
    }

    if (filters.action) {
      where.action = { contains: filters.action, mode: 'insensitive' };
    }

    if (filters.entityType) {
      where.entityType = filters.entityType;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    const [logs, total] = await Promise.all([
      prisma.adminLog.findMany({
        where,
        include: {
          admin: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.adminLog.count({ where }),
    ]);

    return { logs, total };
  }

  async findById(id: string): Promise<AdminLog | null> {
    return prisma.adminLog.findUnique({
      where: { id },
      include: {
        admin: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });
  }
}

export const adminLogService = new AdminLogService();
