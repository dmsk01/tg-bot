import { prisma } from '../database/prisma/client.js';
import type { User } from '@prisma/client';
import type { TelegramUser } from '../common/types/index.js';
import { v4 as uuidv4 } from 'uuid';

export class UserService {
  async findByTelegramId(telegramId: number): Promise<User | null> {
    return prisma.user.findUnique({
      where: { telegramId: BigInt(telegramId) },
      include: { settings: true },
    });
  }

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
      include: { settings: true },
    });
  }

  async createFromTelegram(telegramUser: TelegramUser): Promise<User> {
    const referralCode = uuidv4().slice(0, 8).toUpperCase();

    const user = await prisma.user.create({
      data: {
        telegramId: BigInt(telegramUser.id),
        username: telegramUser.username,
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name,
        languageCode: telegramUser.language_code?.startsWith('en') ? 'en' : 'ru',
        referralCode,
        settings: {
          create: {},
        },
      },
      include: { settings: true },
    });

    // Get welcome bonus from system settings
    const welcomeBonusSetting = await prisma.systemSettings.findUnique({
      where: { key: 'welcome_bonus' },
    });

    const welcomeBonus = (welcomeBonusSetting?.value as number) || 50;

    // Add welcome bonus
    await this.addBalance(user.id, welcomeBonus, 'Welcome bonus');

    return this.findById(user.id) as Promise<User>;
  }

  async updateLastActive(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { lastActiveAt: new Date() },
    });
  }

  async updateLanguage(userId: string, languageCode: string): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: { languageCode },
    });
  }

  async confirmAge(userId: string): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: { isAgeConfirmed: true },
    });
  }

  async getBalance(userId: string): Promise<number> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { balance: true },
    });
    return user?.balance.toNumber() || 0;
  }

  async addBalance(userId: string, amount: number, description?: string): Promise<User> {
    // Use interactive transaction with row locking to prevent race condition
    await prisma.$transaction(async (tx) => {
      const users = await tx.$queryRaw<Array<{ id: string; balance: number }>>`
        SELECT id, balance::numeric as balance FROM users WHERE id = ${userId} FOR UPDATE
      `;

      const user = users[0];
      if (!user) {
        throw new Error('User not found');
      }

      const balanceBefore = Number(user.balance);
      const balanceAfter = balanceBefore + amount;

      await tx.user.update({
        where: { id: userId },
        data: { balance: balanceAfter },
      });

      await tx.transaction.create({
        data: {
          userId,
          type: 'BONUS',
          amount,
          balanceBefore,
          balanceAfter,
          status: 'COMPLETED',
          description,
          completedAt: new Date(),
        },
      });
    });

    return this.findById(userId) as Promise<User>;
  }

  async deductBalance(userId: string, amount: number, description?: string, generationId?: string): Promise<boolean> {
    // Use interactive transaction with row locking to prevent race condition
    return prisma.$transaction(async (tx) => {
      // Lock the row with SELECT FOR UPDATE to prevent concurrent modifications
      const users = await tx.$queryRaw<Array<{ id: string; balance: number }>>`
        SELECT id, balance::numeric as balance FROM users WHERE id = ${userId} FOR UPDATE
      `;

      const user = users[0];
      if (!user) {
        throw new Error('User not found');
      }

      const balanceBefore = Number(user.balance);
      if (balanceBefore < amount) {
        return false;
      }

      const balanceAfter = balanceBefore - amount;

      await tx.user.update({
        where: { id: userId },
        data: { balance: balanceAfter },
      });

      await tx.transaction.create({
        data: {
          userId,
          type: 'WITHDRAWAL',
          amount: -amount,
          balanceBefore,
          balanceAfter,
          status: 'COMPLETED',
          description,
          generationId,
          completedAt: new Date(),
        },
      });

      return true;
    });
  }

  async refundBalance(userId: string, amount: number, description?: string, generationId?: string): Promise<User> {
    // Use interactive transaction with row locking to prevent race condition
    await prisma.$transaction(async (tx) => {
      const users = await tx.$queryRaw<Array<{ id: string; balance: number }>>`
        SELECT id, balance::numeric as balance FROM users WHERE id = ${userId} FOR UPDATE
      `;

      const user = users[0];
      if (!user) {
        throw new Error('User not found');
      }

      const balanceBefore = Number(user.balance);
      const balanceAfter = balanceBefore + amount;

      await tx.user.update({
        where: { id: userId },
        data: { balance: balanceAfter },
      });

      await tx.transaction.create({
        data: {
          userId,
          type: 'REFUND',
          amount,
          balanceBefore,
          balanceAfter,
          status: 'COMPLETED',
          description,
          generationId,
          completedAt: new Date(),
        },
      });
    });

    return this.findById(userId) as Promise<User>;
  }

  async updateSettings(
    userId: string,
    settings: { defaultModel?: string; defaultAspectRatio?: string; notificationsEnabled?: boolean }
  ) {
    return prisma.userSettings.upsert({
      where: { userId },
      update: settings,
      create: { userId, ...settings },
    });
  }

  async getSettings(userId: string) {
    return prisma.userSettings.findUnique({
      where: { userId },
    });
  }
}

export const userService = new UserService();
