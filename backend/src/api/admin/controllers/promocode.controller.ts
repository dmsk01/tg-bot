import { Response } from 'express';
import { z } from 'zod';
import { promocodeService, UpdatePromocodeParams } from '../../../services/admin/promocode.service.js';
import type { AdminRequest } from '../middlewares/admin-auth.middleware.js';
import { extractClientInfo } from '../middlewares/admin-auth.middleware.js';

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

const promocodeFiltersSchema = z.object({
  search: z.string().optional(),
  type: z.enum(['FIXED_AMOUNT', 'PERCENTAGE', 'BONUS_CREDITS']).optional(),
  isActive: z.enum(['true', 'false']).optional().transform(v => v === 'true' ? true : v === 'false' ? false : undefined),
  isExpired: z.enum(['true', 'false']).optional().transform(v => v === 'true' ? true : v === 'false' ? false : undefined),
});

const createPromocodeSchema = z.object({
  code: z.string().min(1).max(50).optional(),
  type: z.enum(['FIXED_AMOUNT', 'PERCENTAGE', 'BONUS_CREDITS']),
  value: z.number().positive(),
  maxUsages: z.number().int().positive().optional(),
  maxUsagesPerUser: z.number().int().positive().optional().default(1),
  minBalance: z.number().optional(),
  startsAt: z.string().datetime().optional().transform(v => v ? new Date(v) : undefined),
  expiresAt: z.string().datetime().optional().transform(v => v ? new Date(v) : undefined),
  description: z.string().optional(),
});

const updatePromocodeSchema = z.object({
  type: z.enum(['FIXED_AMOUNT', 'PERCENTAGE', 'BONUS_CREDITS']).optional(),
  value: z.number().positive().optional(),
  maxUsages: z.number().int().positive().nullable().optional(),
  maxUsagesPerUser: z.number().int().positive().optional(),
  minBalance: z.number().nullable().optional(),
  startsAt: z.string().datetime().nullable().optional().transform(v => v ? new Date(v) : v === null ? null : undefined),
  expiresAt: z.string().datetime().nullable().optional().transform(v => v ? new Date(v) : v === null ? null : undefined),
  description: z.string().nullable().optional(),
});

const generateBatchSchema = z.object({
  count: z.number().int().positive().max(1000),
  prefix: z.string().min(1).max(20).optional().default('BATCH'),
  type: z.enum(['FIXED_AMOUNT', 'PERCENTAGE', 'BONUS_CREDITS']),
  value: z.number().positive(),
  maxUsages: z.number().int().positive().optional(),
  maxUsagesPerUser: z.number().int().positive().optional().default(1),
  minBalance: z.number().optional(),
  startsAt: z.string().datetime().optional().transform(v => v ? new Date(v) : undefined),
  expiresAt: z.string().datetime().optional().transform(v => v ? new Date(v) : undefined),
  description: z.string().optional(),
});

const validateCodeSchema = z.object({
  code: z.string().min(1),
});

export class PromocodeController {
  async getPromocodes(req: AdminRequest, res: Response): Promise<void> {
    const pagination = paginationSchema.parse(req.query);
    const filters = promocodeFiltersSchema.parse(req.query);

    const { promocodes, total } = await promocodeService.findMany(filters, pagination);

    res.json({
      success: true,
      data: {
        promocodes: promocodes.map(p => ({
          ...p,
          value: p.value.toNumber(),
          minBalance: p.minBalance?.toNumber() ?? null,
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

  async getPromocode(req: AdminRequest, res: Response): Promise<void> {
    const { id } = req.params;

    const promocode = await promocodeService.findById(id);

    if (!promocode) {
      res.status(404).json({
        success: false,
        error: 'Promocode not found',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        ...promocode,
        value: promocode.value.toNumber(),
        minBalance: promocode.minBalance?.toNumber() ?? null,
      },
    });
  }

  async createPromocode(req: AdminRequest, res: Response): Promise<void> {
    const validation = createPromocodeSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.error.errors,
      });
      return;
    }

    const { ipAddress, userAgent } = extractClientInfo(req);

    const promocode = await promocodeService.create(
      {
        ...validation.data,
        createdById: req.admin!.id,
      },
      req.admin!.id,
      ipAddress,
      userAgent
    );

    res.status(201).json({
      success: true,
      data: {
        ...promocode,
        value: promocode.value.toNumber(),
        minBalance: promocode.minBalance?.toNumber() ?? null,
      },
    });
  }

  async updatePromocode(req: AdminRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const validation = updatePromocodeSchema.safeParse(req.body);

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
      const updateData: UpdatePromocodeParams = {};
      const data = validation.data;

      if (data.type !== undefined) updateData.type = data.type;
      if (data.value !== undefined) updateData.value = data.value;
      if ('maxUsages' in data) updateData.maxUsages = data.maxUsages ?? null;
      if (data.maxUsagesPerUser !== undefined) updateData.maxUsagesPerUser = data.maxUsagesPerUser;
      if ('minBalance' in data) updateData.minBalance = data.minBalance ?? null;
      if ('startsAt' in data) updateData.startsAt = data.startsAt ?? null;
      if ('expiresAt' in data) updateData.expiresAt = data.expiresAt ?? null;
      if ('description' in data) updateData.description = data.description ?? null;

      const promocode = await promocodeService.update(
        id,
        updateData,
        req.admin!.id,
        ipAddress,
        userAgent
      );

      res.json({
        success: true,
        data: {
          ...promocode,
          value: promocode.value.toNumber(),
          minBalance: promocode.minBalance?.toNumber() ?? null,
        },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update promocode',
      });
    }
  }

  async revokePromocode(req: AdminRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const { ipAddress, userAgent } = extractClientInfo(req);

    try {
      const promocode = await promocodeService.revoke(
        id,
        req.admin!.id,
        ipAddress,
        userAgent
      );

      res.json({
        success: true,
        data: {
          ...promocode,
          value: promocode.value.toNumber(),
          minBalance: promocode.minBalance?.toNumber() ?? null,
        },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to revoke promocode',
      });
    }
  }

  async deletePromocode(req: AdminRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const { ipAddress, userAgent } = extractClientInfo(req);

    try {
      await promocodeService.delete(id, req.admin!.id, ipAddress, userAgent);

      res.json({
        success: true,
        message: 'Promocode deleted successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete promocode',
      });
    }
  }

  async getPromocodeUsages(req: AdminRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const pagination = paginationSchema.parse(req.query);

    const { usages, total } = await promocodeService.getUsages(id, pagination);

    res.json({
      success: true,
      data: {
        usages: usages.map(u => ({
          ...u,
          appliedValue: u.appliedValue.toNumber(),
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

  async generateBatch(req: AdminRequest, res: Response): Promise<void> {
    const validation = generateBatchSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.error.errors,
      });
      return;
    }

    const { count, prefix, ...params } = validation.data;
    const { ipAddress, userAgent } = extractClientInfo(req);

    const promocodes = await promocodeService.createBatch(
      count,
      {
        ...params,
        createdById: req.admin!.id,
      },
      prefix,
      req.admin!.id,
      ipAddress,
      userAgent
    );

    res.status(201).json({
      success: true,
      data: {
        count: promocodes.length,
        promocodes: promocodes.map(p => ({
          id: p.id,
          code: p.code,
          value: p.value.toNumber(),
        })),
      },
    });
  }

  async validateCode(req: AdminRequest, res: Response): Promise<void> {
    const validation = validateCodeSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.error.errors,
      });
      return;
    }

    const promocode = await promocodeService.findByCode(validation.data.code);

    if (!promocode) {
      res.json({
        success: true,
        data: {
          exists: false,
          valid: false,
        },
      });
      return;
    }

    const now = new Date();
    const isExpired = promocode.expiresAt && promocode.expiresAt < now;
    const isNotStarted = promocode.startsAt && promocode.startsAt > now;

    res.json({
      success: true,
      data: {
        exists: true,
        valid: promocode.isActive && !isExpired && !isNotStarted,
        promocode: {
          id: promocode.id,
          code: promocode.code,
          type: promocode.type,
          value: promocode.value.toNumber(),
          isActive: promocode.isActive,
          isExpired: !!isExpired,
          isNotStarted: !!isNotStarted,
        },
      },
    });
  }
}

export const promocodeController = new PromocodeController();
