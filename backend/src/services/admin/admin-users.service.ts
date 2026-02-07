import { prisma } from '../../database/prisma/client.js';
import { adminLogService } from './admin-log.service.js';
import type { User, Prisma, AdminUser } from '@prisma/client';

export interface UserFilters {
  search?: string;
  isBlocked?: boolean;
  isAdmin?: boolean;
  minBalance?: number;
  maxBalance?: number;
  startDate?: Date;
  endDate?: Date;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface UserWithStats extends User {
  _count?: {
    generations: number;
    transactions: number;
  };
}

export interface BalanceChangeParams {
  userId: string;
  amount: number;
  reason: string;
  adminId: string;
  ipAddress?: string;
  userAgent?: string;
}

export class AdminUsersService {
  async findMany(
    filters: UserFilters = {},
    pagination: PaginationParams = {}
  ): Promise<{ users: UserWithStats[]; total: number }> {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    if (filters.search) {
      where.OR = [
        { username: { contains: filters.search, mode: 'insensitive' } },
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
      ];

      const telegramId = parseInt(filters.search, 10);
      if (!isNaN(telegramId)) {
        where.OR.push({ telegramId: BigInt(telegramId) });
      }
    }

    if (typeof filters.isBlocked === 'boolean') {
      where.isBlocked = filters.isBlocked;
    }

    if (typeof filters.isAdmin === 'boolean') {
      where.isAdmin = filters.isAdmin;
    }

    if (filters.minBalance !== undefined || filters.maxBalance !== undefined) {
      where.balance = {};
      if (filters.minBalance !== undefined) {
        where.balance.gte = filters.minBalance;
      }
      if (filters.maxBalance !== undefined) {
        where.balance.lte = filters.maxBalance;
      }
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

    const orderBy: Prisma.UserOrderByWithRelationInput = {};
    if (sortBy === 'balance') {
      orderBy.balance = sortOrder;
    } else if (sortBy === 'lastActiveAt') {
      orderBy.lastActiveAt = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          _count: {
            select: {
              generations: true,
              transactions: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return { users: users as UserWithStats[], total };
  }

  async findById(id: string): Promise<UserWithStats | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        settings: true,
        _count: {
          select: {
            generations: true,
            transactions: true,
            promocodeUsages: true,
          },
        },
      },
    });

    return user as UserWithStats | null;
  }

  async update(
    id: string,
    data: { isBlocked?: boolean; isAdmin?: boolean },
    adminId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<User> {
    const user = await prisma.user.update({
      where: { id },
      data,
    });

    await adminLogService.create({
      adminId,
      action: 'UPDATE_USER',
      entityType: 'User',
      entityId: id,
      details: data,
      ipAddress,
      userAgent,
    });

    return user;
  }

  async changeBalance(params: BalanceChangeParams): Promise<User> {
    const { userId, amount, reason, adminId, ipAddress, userAgent } = params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const balanceBefore = user.balance.toNumber();
    const balanceAfter = balanceBefore + amount;

    if (balanceAfter < 0) {
      throw new Error('Insufficient balance');
    }

    const [updatedUser] = await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { balance: balanceAfter },
      }),
      prisma.transaction.create({
        data: {
          userId,
          type: amount >= 0 ? 'BONUS' : 'WITHDRAWAL',
          amount: Math.abs(amount),
          balanceBefore,
          balanceAfter,
          status: 'COMPLETED',
          description: `Admin: ${reason}`,
          completedAt: new Date(),
        },
      }),
    ]);

    await adminLogService.create({
      adminId,
      action: 'CHANGE_BALANCE',
      entityType: 'User',
      entityId: userId,
      details: { amount, reason, balanceBefore, balanceAfter },
      ipAddress,
      userAgent,
    });

    return updatedUser;
  }

  async getUserTransactions(
    userId: string,
    pagination: PaginationParams = {}
  ): Promise<{ transactions: unknown[]; total: number }> {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where: { userId } }),
    ]);

    return { transactions, total };
  }

  async getUserGenerations(
    userId: string,
    pagination: PaginationParams = {}
  ): Promise<{ generations: unknown[]; total: number }> {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const [generations, total] = await Promise.all([
      prisma.generation.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.generation.count({ where: { userId } }),
    ]);

    return { generations, total };
  }

  async deleteUser(
    id: string,
    adminId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new Error('User not found');
    }

    await prisma.user.update({
      where: { id },
      data: { isBlocked: true },
    });

    await adminLogService.create({
      adminId,
      action: 'DELETE_USER',
      entityType: 'User',
      entityId: id,
      details: { telegramId: user.telegramId.toString(), username: user.username },
      ipAddress,
      userAgent,
    });
  }

  async getAdminList(
    pagination: PaginationParams = {}
  ): Promise<{ admins: Omit<AdminUser, 'passwordHash'>[]; total: number }> {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const [admins, total] = await Promise.all([
      prisma.adminUser.findMany({
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.adminUser.count(),
    ]);

    return { admins: admins as Omit<AdminUser, 'passwordHash'>[], total };
  }

  async updateAdmin(
    id: string,
    data: { isActive?: boolean; role?: string; firstName?: string; lastName?: string },
    adminId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<Omit<AdminUser, 'passwordHash'>> {
    const admin = await prisma.adminUser.update({
      where: { id },
      data: data as Prisma.AdminUserUpdateInput,
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await adminLogService.create({
      adminId,
      action: 'UPDATE_ADMIN',
      entityType: 'AdminUser',
      entityId: id,
      details: data,
      ipAddress,
      userAgent,
    });

    return admin as Omit<AdminUser, 'passwordHash'>;
  }
}

export const adminUsersService = new AdminUsersService();
