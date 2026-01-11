import { Context, MiddlewareFn } from 'telegraf';
import { userService } from '../../services/user.service.js';
import { logger } from '../../common/utils/logger.util.js';
import type { User } from '@prisma/client';

export interface BotContext extends Context {
  dbUser?: User;
}

export const authMiddleware: MiddlewareFn<BotContext> = async (ctx, next) => {
  try {
    const telegramUser = ctx.from;
    if (!telegramUser) {
      return next();
    }

    let user = await userService.findByTelegramId(telegramUser.id);

    if (!user) {
      user = await userService.createFromTelegram({
        id: telegramUser.id,
        is_bot: telegramUser.is_bot,
        first_name: telegramUser.first_name,
        last_name: telegramUser.last_name,
        username: telegramUser.username,
        language_code: telegramUser.language_code,
      });
      logger.info(`New user registered: ${telegramUser.id} (@${telegramUser.username})`);
    } else {
      await userService.updateLastActive(user.id);
    }

    ctx.dbUser = user;
    return next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    return next();
  }
};
