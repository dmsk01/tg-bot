import { PrismaClient } from '@prisma/client';
import { configService } from '../../common/config/config.service.js';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: configService.isDevelopment ? ['query', 'error', 'warn'] : ['error'],
  });

if (!configService.isProduction) {
  globalForPrisma.prisma = prisma;
}
