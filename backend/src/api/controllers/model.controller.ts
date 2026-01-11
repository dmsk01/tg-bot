import { Response } from 'express';
import type { AuthenticatedRequest } from '../middlewares/validate-telegram.middleware.js';
import { modelService } from '../../services/ai/model.service.js';

export class ModelController {
  async getAll(req: AuthenticatedRequest, res: Response): Promise<void> {
    const models = await modelService.findAll();
    const lang = req.user?.languageCode || 'ru';

    const mappedModels = models.map((m) => ({
      id: m.id,
      name: m.name,
      displayName: lang === 'en' ? m.displayNameEn : m.displayNameRu,
      description: lang === 'en' ? m.descriptionEn : m.descriptionRu,
      costPerGeneration: m.costPerGeneration.toNumber(),
      maxWidth: m.maxWidth,
      maxHeight: m.maxHeight,
      supportedRatios: m.supportedRatios,
    }));

    res.json({
      success: true,
      data: mappedModels,
    });
  }
}

export const modelController = new ModelController();
