import { Response } from 'express';
import type { AuthenticatedRequest } from '../middlewares/validate-telegram.middleware.js';
import { templateService } from '../../services/template.service.js';

export class TemplateController {
  async getAll(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { category } = req.query;
    const templates = await templateService.findAll(category as string);

    const lang = req.user?.languageCode || 'ru';

    const mappedTemplates = templates.map((t) => ({
      id: t.id,
      name: lang === 'en' ? t.nameEn : t.nameRu,
      description: lang === 'en' ? t.descriptionEn : t.descriptionRu,
      category: t.category,
      previewImage: t.previewImage,
      promptTemplate: t.promptTemplate,
    }));

    res.json({
      success: true,
      data: mappedTemplates,
    });
  }

  async getById(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const template = await templateService.findById(id);

    if (!template) {
      res.status(404).json({
        success: false,
        error: 'Template not found',
      });
      return;
    }

    const lang = req.user?.languageCode || 'ru';

    res.json({
      success: true,
      data: {
        id: template.id,
        name: lang === 'en' ? template.nameEn : template.nameRu,
        description: lang === 'en' ? template.descriptionEn : template.descriptionRu,
        category: template.category,
        previewImage: template.previewImage,
        promptTemplate: template.promptTemplate,
      },
    });
  }

  async getCategories(req: AuthenticatedRequest, res: Response): Promise<void> {
    const categories = await templateService.getCategories();

    res.json({
      success: true,
      data: categories,
    });
  }

  async getPopular(req: AuthenticatedRequest, res: Response): Promise<void> {
    const limit = parseInt(req.query.limit as string) || 10;
    const templates = await templateService.getPopular(limit);

    const lang = req.user?.languageCode || 'ru';

    const mappedTemplates = templates.map((t) => ({
      id: t.id,
      name: lang === 'en' ? t.nameEn : t.nameRu,
      category: t.category,
      usageCount: t.usageCount,
    }));

    res.json({
      success: true,
      data: mappedTemplates,
    });
  }
}

export const templateController = new TemplateController();
