import { prisma } from '../database/prisma/client.js';
import type { Template } from '@prisma/client';

export class TemplateService {
  async findAll(category?: string): Promise<Template[]> {
    return prisma.template.findMany({
      where: {
        isActive: true,
        ...(category && { category }),
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findById(id: string): Promise<Template | null> {
    return prisma.template.findUnique({
      where: { id },
    });
  }

  async getCategories(): Promise<string[]> {
    const templates = await prisma.template.findMany({
      where: { isActive: true },
      select: { category: true },
      distinct: ['category'],
    });

    return templates.map((t) => t.category);
  }

  async incrementUsage(id: string): Promise<void> {
    await prisma.template.update({
      where: { id },
      data: { usageCount: { increment: 1 } },
    });
  }

  async getPopular(limit = 10): Promise<Template[]> {
    return prisma.template.findMany({
      where: { isActive: true },
      orderBy: { usageCount: 'desc' },
      take: limit,
    });
  }
}

export const templateService = new TemplateService();
