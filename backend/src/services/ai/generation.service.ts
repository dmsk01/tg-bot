import { prisma } from '../../database/prisma/client.js';
import type { Generation, GenerationStatus } from '@prisma/client';
import { userService } from '../user.service.js';
import { modelService } from './model.service.js';
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
}

export class GenerationService {
  async create(params: CreateGenerationParams): Promise<Generation> {
    const { userId, model, prompt, negativePrompt, templateId, aspectRatio, sourceImageUrl } = params;

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
        width: dimensions.width,
        height: dimensions.height,
        sourceImageUrl,
        cost,
        status: 'QUEUED',
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

    // TODO: In production, add to queue for processing
    // For MVP, we simulate processing
    this.simulateProcessing(generation.id);

    return generation;
  }

  private async simulateProcessing(generationId: string): Promise<void> {
    // Mark as processing
    await prisma.generation.update({
      where: { id: generationId },
      data: {
        status: 'PROCESSING',
        processingStartedAt: new Date(),
      },
    });

    // Simulate delay (in production, this would be actual API call)
    setTimeout(async () => {
      try {
        // For MVP, just mark as completed with placeholder
        await prisma.generation.update({
          where: { id: generationId },
          data: {
            status: 'COMPLETED',
            generatedImageUrl: '/generated/placeholder.png',
            processingEndedAt: new Date(),
          },
        });
        logger.info(`Generation ${generationId} completed (simulated)`);
      } catch (error) {
        logger.error(`Generation ${generationId} failed:`, error);
        await prisma.generation.update({
          where: { id: generationId },
          data: {
            status: 'FAILED',
            errorMessage: 'Processing failed',
            processingEndedAt: new Date(),
          },
        });
      }
    }, 3000);
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
