import { Response } from 'express';
import type { AuthenticatedRequest } from '../middlewares/validate-telegram.middleware.js';
import { generationService } from '../../services/ai/generation.service.js';
import { userService } from '../../services/user.service.js';
import { modelService } from '../../services/ai/model.service.js';
import type { AspectRatio } from '../../common/types/index.js';

export class GenerationController {
  async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    const user = req.user!;
    const { model, prompt, negativePrompt, templateId, aspectRatio } = req.body;

    // Validate required fields
    if (!prompt || !model || !aspectRatio) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: prompt, model, aspectRatio',
      });
      return;
    }

    // Check balance
    const cost = await modelService.getCost(model);
    const balance = await userService.getBalance(user.id);

    if (balance < cost) {
      res.status(402).json({
        success: false,
        error: 'Insufficient balance',
        data: { required: cost, current: balance },
      });
      return;
    }

    try {
      const generation = await generationService.create({
        userId: user.id,
        model,
        prompt,
        negativePrompt,
        templateId,
        aspectRatio: aspectRatio as AspectRatio,
      });

      res.status(201).json({
        success: true,
        data: {
          id: generation.id,
          status: generation.status,
          cost: generation.cost.toNumber(),
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Generation failed',
      });
    }
  }

  async getStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const generation = await generationService.findById(id);

    if (!generation) {
      res.status(404).json({
        success: false,
        error: 'Generation not found',
      });
      return;
    }

    if (generation.userId !== req.user!.id) {
      res.status(403).json({
        success: false,
        error: 'Access denied',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: generation.id,
        status: generation.status,
        generatedImageUrl: generation.generatedImageUrl,
        errorMessage: generation.errorMessage,
        createdAt: generation.createdAt,
        processingStartedAt: generation.processingStartedAt,
        processingEndedAt: generation.processingEndedAt,
      },
    });
  }

  async getHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const { items, total } = await generationService.findByUserId(req.user!.id, {
      page,
      limit,
    });

    res.json({
      success: true,
      data: {
        items: items.map((g) => ({
          id: g.id,
          model: g.model,
          prompt: g.prompt,
          aspectRatio: g.aspectRatio,
          status: g.status,
          generatedImageUrl: g.generatedImageUrl,
          cost: g.cost.toNumber(),
          createdAt: g.createdAt,
        })),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  }

  async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const generation = await generationService.findById(id);

    if (!generation) {
      res.status(404).json({
        success: false,
        error: 'Generation not found',
      });
      return;
    }

    if (generation.userId !== req.user!.id) {
      res.status(403).json({
        success: false,
        error: 'Access denied',
      });
      return;
    }

    await generationService.delete(id);

    res.json({
      success: true,
      message: 'Generation deleted',
    });
  }
}

export const generationController = new GenerationController();
