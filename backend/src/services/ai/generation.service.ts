import { prisma } from '../../database/prisma/client.js';
import type { Generation, GenerationStatus, GenerationType } from '@prisma/client';
import { userService } from '../user.service.js';
import { modelService } from './model.service.js';
import { replicateService, FLUX_MODELS, type FluxModelName } from './replicate.service.js';
import { ASPECT_RATIO_DIMENSIONS, type AspectRatio } from '../../common/types/index.js';
import { logger } from '../../common/utils/logger.util.js';

export interface CreateGenerationParams {
  userId: string;
  model: string;
  prompt: string;
  negativePrompt?: string;
  templateId?: string;
  aspectRatio: AspectRatio;
  sourceImageUrl?: string;
  generationType?: GenerationType;
  maskImageUrl?: string;
  seed?: number;
  guidance?: number;
  steps?: number;
  strength?: number;
}

export class GenerationService {
  async create(params: CreateGenerationParams): Promise<Generation> {
    const {
      userId,
      model,
      prompt,
      negativePrompt,
      templateId,
      aspectRatio,
      sourceImageUrl,
      generationType = 'TEXT_TO_IMAGE',
      maskImageUrl,
      seed,
      guidance,
      steps,
      strength,
    } = params;

    // Get model cost
    const cost = await modelService.getCost(model);

    // Check and deduct balance
    const dimensions = ASPECT_RATIO_DIMENSIONS[aspectRatio];

    const generation = await prisma.generation.create({
      data: {
        userId,
        model,
        prompt,
        negativePrompt,
        templateId,
        aspectRatio,
        width: dimensions?.width,
        height: dimensions?.height,
        sourceImageUrl,
        maskImageUrl,
        generationType,
        seed,
        guidance: guidance ?? 3.5,
        steps: steps ?? 28,
        strength: strength ?? 0.75,
        cost,
        status: 'PENDING',
      },
    });

    // Deduct balance
    const deducted = await userService.deductBalance(
      userId,
      cost,
      `Generation: ${generation.id}`,
      generation.id
    );

    if (!deducted) {
      await prisma.generation.update({
        where: { id: generation.id },
        data: { status: 'FAILED', errorMessage: 'Insufficient balance' },
      });
      throw new Error('Insufficient balance');
    }

    // Process generation asynchronously
    this.processGeneration(generation.id, params);

    return generation;
  }

  private isFluxModel(model: string): model is FluxModelName {
    return model in FLUX_MODELS;
  }

  private async processGeneration(generationId: string, params: CreateGenerationParams): Promise<void> {
    const { model, prompt, aspectRatio, sourceImageUrl, maskImageUrl, seed, generationType } = params;

    // Mark as processing
    await prisma.generation.update({
      where: { id: generationId },
      data: {
        status: 'PROCESSING',
        startedAt: new Date(),
        processingStartedAt: new Date(),
      },
    });

    try {
      // Check if Replicate is configured and model is Flux
      if (replicateService.isConfigured() && this.isFluxModel(model)) {
        let result;

        if (generationType === 'INPAINTING' && sourceImageUrl && maskImageUrl) {
          // Inpainting mode
          result = await replicateService.inpaint({
            prompt,
            image: sourceImageUrl,
            mask: maskImageUrl,
            seed,
          });
        } else if (generationType === 'IMAGE_TO_IMAGE' && sourceImageUrl) {
          // Image-to-image mode (not implemented in current service, using text-to-image)
          result = await replicateService.textToImage(model, {
            prompt,
            aspectRatio,
            seed,
          });
        } else {
          // Text-to-image mode
          result = await replicateService.textToImage(model, {
            prompt,
            aspectRatio,
            seed,
          });
        }

        if (result.status === 'succeeded' && result.output) {
          const imageUrl = Array.isArray(result.output) ? result.output[0] : result.output;

          await prisma.generation.update({
            where: { id: generationId },
            data: {
              status: 'COMPLETED',
              resultUrl: imageUrl,
              generatedImageUrl: imageUrl,
              replicatePredictionId: result.id,
              completedAt: new Date(),
              processingEndedAt: new Date(),
            },
          });

          logger.info(`Generation ${generationId} completed successfully`, { resultUrl: imageUrl });
        } else {
          throw new Error(result.error || 'Generation failed');
        }
      } else {
        // Fallback: Simulation mode (for development without API key)
        logger.warn(`Generation ${generationId} running in simulation mode (no Replicate API token or unsupported model)`);

        await new Promise(resolve => setTimeout(resolve, 2000));

        await prisma.generation.update({
          where: { id: generationId },
          data: {
            status: 'COMPLETED',
            generatedImageUrl: '/generated/placeholder.png',
            completedAt: new Date(),
            processingEndedAt: new Date(),
          },
        });

        logger.info(`Generation ${generationId} completed (simulated)`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Processing failed';
      logger.error(`Generation ${generationId} failed:`, error);

      await prisma.generation.update({
        where: { id: generationId },
        data: {
          status: 'FAILED',
          errorMessage,
          completedAt: new Date(),
          processingEndedAt: new Date(),
        },
      });

      // Refund balance on failure
      await userService.refundBalance(
        params.userId,
        await modelService.getCost(params.model),
        `Refund for failed generation: ${generationId}`,
        generationId
      );
    }
  }

  async findById(id: string): Promise<Generation | null> {
    return prisma.generation.findUnique({
      where: { id },
      include: { template: true },
    });
  }

  async findByUserId(
    userId: string,
    options: { page?: number; limit?: number } = {}
  ): Promise<{ items: Generation[]; total: number }> {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.generation.findMany({
        where: { userId },
        include: { template: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.generation.count({ where: { userId } }),
    ]);

    return { items, total };
  }

  async updateStatus(
    id: string,
    status: GenerationStatus,
    data?: {
      generatedImageUrl?: string;
      errorMessage?: string;
      processingStartedAt?: Date;
      processingEndedAt?: Date;
      externalId?: string;
    }
  ): Promise<Generation> {
    return prisma.generation.update({
      where: { id },
      data: { status, ...data },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.generation.delete({
      where: { id },
    });
  }
}

export const generationService = new GenerationService();
