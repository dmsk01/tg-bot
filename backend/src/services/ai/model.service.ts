import { prisma } from '../../database/prisma/client.js';
import type { AiModel } from '@prisma/client';

export class ModelService {
  async findAll(): Promise<AiModel[]> {
    return prisma.aiModel.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findByName(name: string): Promise<AiModel | null> {
    return prisma.aiModel.findUnique({
      where: { name },
    });
  }

  async getCost(modelName: string): Promise<number> {
    const model = await this.findByName(modelName);
    return model?.costPerGeneration.toNumber() || 10;
  }
}

export const modelService = new ModelService();
