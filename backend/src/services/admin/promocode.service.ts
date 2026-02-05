import { prisma } from '../../database/prisma/client.js';
import { adminLogService } from './admin-log.service.js';
import { v4 as uuidv4 } from 'uuid';
import type { Promocode, PromocodeUsage, PromocodeType, Prisma } from '@prisma/client';

export interface CreatePromocodeParams {
  code?: string;
  type: PromocodeType;
  value: number;
  maxUsages?: number;
  maxUsagesPerUser?: number;
  minBalance?: number;
  startsAt?: Date;
  expiresAt?: Date;
  description?: string;
  createdById?: string;
}

export interface UpdatePromocodeParams {
  type?: PromocodeType;
  value?: number;
  maxUsages?: number | null;
  maxUsagesPerUser?: number;
  minBalance?: number | null;
  startsAt?: Date | null;
  expiresAt?: Date | null;
  description?: string | null;
}

export interface PromocodeFilters {
  search?: string;
  type?: PromocodeType;
  isActive?: boolean;
  isExpired?: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PromocodeWithStats extends Promocode {
  _count?: {
    usages: number;
  };
}

export interface ValidateResult {
  valid: boolean;
  promocode?: Promocode;
  error?: string;
}

export interface ApplyResult {
  success: boolean;
  appliedValue?: number;
  error?: string;
}

export class PromocodeService {
  generateCode(prefix: string = 'PROMO'): string {
    const random = uuidv4().slice(0, 8).toUpperCase();
    return `${prefix}-${random}`;
  }

  async create(
    params: CreatePromocodeParams,
    adminId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<Promocode> {
    const code = params.code || this.generateCode();

    const promocode = await prisma.promocode.create({
      data: {
        code: code.toUpperCase(),
        type: params.type,
        value: params.value,
        maxUsages: params.maxUsages,
        maxUsagesPerUser: params.maxUsagesPerUser ?? 1,
        minBalance: params.minBalance,
        startsAt: params.startsAt,
        expiresAt: params.expiresAt,
        description: params.description,
        createdById: params.createdById,
      },
    });

    if (adminId) {
      await adminLogService.create({
        adminId,
        action: 'CREATE_PROMOCODE',
        entityType: 'Promocode',
        entityId: promocode.id,
        details: { code: promocode.code, type: promocode.type, value: params.value },
        ipAddress,
        userAgent,
      });
    }

    return promocode;
  }

  async createBatch(
    count: number,
    params: Omit<CreatePromocodeParams, 'code'>,
    prefix: string = 'BATCH',
    adminId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<Promocode[]> {
    const promocodes: Promocode[] = [];

    for (let i = 0; i < count; i++) {
      const code = this.generateCode(prefix);
      const promocode = await this.create({ ...params, code }, undefined);
      promocodes.push(promocode);
    }

    if (adminId) {
      await adminLogService.create({
        adminId,
        action: 'CREATE_PROMOCODE_BATCH',
        entityType: 'Promocode',
        details: { count, prefix, type: params.type, value: params.value },
        ipAddress,
        userAgent,
      });
    }

    return promocodes;
  }

  async findMany(
    filters: PromocodeFilters = {},
    pagination: PaginationParams = {}
  ): Promise<{ promocodes: PromocodeWithStats[]; total: number }> {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const where: Prisma.PromocodeWhereInput = {};

    if (filters.search) {
      where.OR = [
        { code: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (typeof filters.isActive === 'boolean') {
      where.isActive = filters.isActive;
    }

    if (filters.isExpired === true) {
      where.expiresAt = { lt: new Date() };
    } else if (filters.isExpired === false) {
      where.OR = [
        { expiresAt: null },
        { expiresAt: { gte: new Date() } },
      ];
    }

    const [promocodes, total] = await Promise.all([
      prisma.promocode.findMany({
        where,
        include: {
          _count: {
            select: { usages: true },
          },
          createdBy: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.promocode.count({ where }),
    ]);

    return { promocodes: promocodes as PromocodeWithStats[], total };
  }

  async findById(id: string): Promise<PromocodeWithStats | null> {
    return prisma.promocode.findUnique({
      where: { id },
      include: {
        _count: {
          select: { usages: true },
        },
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    }) as Promise<PromocodeWithStats | null>;
  }

  async findByCode(code: string): Promise<Promocode | null> {
    return prisma.promocode.findUnique({
      where: { code: code.toUpperCase() },
    });
  }

  async update(
    id: string,
    data: UpdatePromocodeParams,
    adminId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<Promocode> {
    const updateData: Prisma.PromocodeUpdateInput = {};

    if (data.type !== undefined) updateData.type = data.type;
    if (data.value !== undefined) updateData.value = data.value;
    if ('maxUsages' in data) updateData.maxUsages = data.maxUsages;
    if (data.maxUsagesPerUser !== undefined) updateData.maxUsagesPerUser = data.maxUsagesPerUser;
    if ('minBalance' in data) updateData.minBalance = data.minBalance;
    if ('startsAt' in data) updateData.startsAt = data.startsAt;
    if ('expiresAt' in data) updateData.expiresAt = data.expiresAt;
    if ('description' in data) updateData.description = data.description;

    const promocode = await prisma.promocode.update({
      where: { id },
      data: updateData,
    });

    await adminLogService.create({
      adminId,
      action: 'UPDATE_PROMOCODE',
      entityType: 'Promocode',
      entityId: id,
      details: data as Record<string, unknown>,
      ipAddress,
      userAgent,
    });

    return promocode;
  }

  async revoke(
    id: string,
    adminId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<Promocode> {
    const promocode = await prisma.promocode.update({
      where: { id },
      data: { isActive: false },
    });

    await adminLogService.create({
      adminId,
      action: 'REVOKE_PROMOCODE',
      entityType: 'Promocode',
      entityId: id,
      details: { code: promocode.code },
      ipAddress,
      userAgent,
    });

    return promocode;
  }

  async delete(
    id: string,
    adminId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const promocode = await prisma.promocode.findUnique({
      where: { id },
    });

    if (!promocode) {
      throw new Error('Promocode not found');
    }

    await prisma.promocode.update({
      where: { id },
      data: { isActive: false },
    });

    await adminLogService.create({
      adminId,
      action: 'DELETE_PROMOCODE',
      entityType: 'Promocode',
      entityId: id,
      details: { code: promocode.code },
      ipAddress,
      userAgent,
    });
  }

  async getUsages(
    promocodeId: string,
    pagination: PaginationParams = {}
  ): Promise<{ usages: PromocodeUsage[]; total: number }> {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const [usages, total] = await Promise.all([
      prisma.promocodeUsage.findMany({
        where: { promocodeId },
        include: {
          user: {
            select: {
              id: true,
              telegramId: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { usedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.promocodeUsage.count({ where: { promocodeId } }),
    ]);

    return { usages, total };
  }

  async validate(code: string, userId: string): Promise<ValidateResult> {
    const promocode = await this.findByCode(code);

    if (!promocode) {
      return { valid: false, error: 'Promocode not found' };
    }

    if (!promocode.isActive) {
      return { valid: false, error: 'Promocode is not active' };
    }

    const now = new Date();

    if (promocode.startsAt && promocode.startsAt > now) {
      return { valid: false, error: 'Promocode is not yet active' };
    }

    if (promocode.expiresAt && promocode.expiresAt < now) {
      return { valid: false, error: 'Promocode has expired' };
    }

    if (promocode.maxUsages) {
      const totalUsages = await prisma.promocodeUsage.count({
        where: { promocodeId: promocode.id },
      });

      if (totalUsages >= promocode.maxUsages) {
        return { valid: false, error: 'Promocode usage limit reached' };
      }
    }

    if (promocode.maxUsagesPerUser) {
      const userUsages = await prisma.promocodeUsage.count({
        where: { promocodeId: promocode.id, userId },
      });

      if (userUsages >= promocode.maxUsagesPerUser) {
        return { valid: false, error: 'You have already used this promocode' };
      }
    }

    if (promocode.minBalance) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { balance: true },
      });

      if (user && user.balance.toNumber() < promocode.minBalance.toNumber()) {
        return { valid: false, error: 'Minimum balance requirement not met' };
      }
    }

    return { valid: true, promocode };
  }

  async apply(code: string, userId: string, depositAmount?: number): Promise<ApplyResult> {
    const validation = await this.validate(code, userId);

    if (!validation.valid || !validation.promocode) {
      return { success: false, error: validation.error };
    }

    const promocode = validation.promocode;
    let appliedValue: number;

    switch (promocode.type) {
      case 'FIXED_AMOUNT':
        appliedValue = promocode.value.toNumber();
        break;
      case 'PERCENTAGE':
        if (!depositAmount) {
          return { success: false, error: 'Deposit amount required for percentage promocode' };
        }
        appliedValue = (depositAmount * promocode.value.toNumber()) / 100;
        break;
      case 'BONUS_CREDITS':
        appliedValue = promocode.value.toNumber();
        break;
      default:
        return { success: false, error: 'Unknown promocode type' };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const balanceBefore = user.balance.toNumber();
    const balanceAfter = balanceBefore + appliedValue;

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { balance: balanceAfter },
      }),
      prisma.transaction.create({
        data: {
          userId,
          type: 'BONUS',
          amount: appliedValue,
          balanceBefore,
          balanceAfter,
          status: 'COMPLETED',
          description: `Promocode: ${promocode.code}`,
          completedAt: new Date(),
        },
      }),
      prisma.promocodeUsage.create({
        data: {
          promocodeId: promocode.id,
          userId,
          appliedValue,
        },
      }),
    ]);

    return { success: true, appliedValue };
  }

  async getUserPromocodes(userId: string): Promise<PromocodeUsage[]> {
    return prisma.promocodeUsage.findMany({
      where: { userId },
      include: {
        promocode: {
          select: {
            id: true,
            code: true,
            type: true,
            value: true,
            description: true,
          },
        },
      },
      orderBy: { usedAt: 'desc' },
    });
  }
}

export const promocodeService = new PromocodeService();
