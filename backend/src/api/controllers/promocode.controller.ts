import { Response } from 'express';
import { z } from 'zod';
import { promocodeService } from '../../services/admin/promocode.service.js';
import type { AuthenticatedRequest } from '../middlewares/validate-telegram.middleware.js';

const applySchema = z.object({
  code: z.string().min(1, 'Promocode is required'),
  depositAmount: z.number().positive().optional(),
});

const validateSchema = z.object({
  code: z.string().min(1, 'Promocode is required'),
});

export class UserPromocodeController {
  async apply(req: AuthenticatedRequest, res: Response): Promise<void> {
    const validation = applySchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.error.errors,
      });
      return;
    }

    const { code, depositAmount } = validation.data;
    const result = await promocodeService.apply(code, req.user!.id, depositAmount);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: result.error,
      });
      return;
    }

    res.json({
      success: true,
      data: {
        appliedValue: result.appliedValue,
        message: `Promocode applied successfully! +${result.appliedValue}`,
      },
    });
  }

  async validate(req: AuthenticatedRequest, res: Response): Promise<void> {
    const validation = validateSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.error.errors,
      });
      return;
    }

    const { code } = validation.data;
    const result = await promocodeService.validate(code, req.user!.id);

    if (!result.valid) {
      res.json({
        success: true,
        data: {
          valid: false,
          error: result.error,
        },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        valid: true,
        promocode: {
          code: result.promocode!.code,
          type: result.promocode!.type,
          value: result.promocode!.value.toNumber(),
          description: result.promocode!.description,
        },
      },
    });
  }

  async getMyPromocodes(req: AuthenticatedRequest, res: Response): Promise<void> {
    const usages = await promocodeService.getUserPromocodes(req.user!.id);

    res.json({
      success: true,
      data: usages.map(u => ({
        ...u,
        appliedValue: u.appliedValue.toNumber(),
      })),
    });
  }
}

export const userPromocodeController = new UserPromocodeController();
