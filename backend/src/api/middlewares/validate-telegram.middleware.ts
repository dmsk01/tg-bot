import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { configService } from '../../common/config/config.service.js';
import { userService } from '../../services/user.service.js';
import { logger } from '../../common/utils/logger.util.js';
import type { User } from '@prisma/client';

export interface AuthenticatedRequest extends Request {
  user?: User;
  telegramId?: number;
}

const DEV_TELEGRAM_ID = 12345678;

export function validateTelegramInitData(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const initData = req.headers['x-telegram-init-data'] as string;

    // Dev mode bypass
    if (!initData && configService.isDevelopment) {
      logger.debug('Dev mode: bypassing Telegram validation');
      req.telegramId = DEV_TELEGRAM_ID;
      next();
      return;
    }

    if (!initData) {
      res.status(401).json({ success: false, error: 'Missing Telegram init data' });
      return;
    }

    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');

    if (!hash) {
      res.status(401).json({ success: false, error: 'Invalid init data: missing hash' });
      return;
    }

    // Create data check string
    urlParams.delete('hash');
    const dataCheckArr: string[] = [];
    urlParams.sort();
    urlParams.forEach((value, key) => {
      dataCheckArr.push(`${key}=${value}`);
    });
    const dataCheckString = dataCheckArr.join('\n');

    // Validate hash
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(configService.telegram.botToken)
      .digest();

    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    if (calculatedHash !== hash) {
      logger.warn('Invalid Telegram init data hash');
      res.status(401).json({ success: false, error: 'Invalid init data signature' });
      return;
    }

    // Check auth_date (not older than 1 hour)
    const authDate = parseInt(urlParams.get('auth_date') || '0', 10);
    const now = Math.floor(Date.now() / 1000);
    if (now - authDate > 3600) {
      res.status(401).json({ success: false, error: 'Init data expired' });
      return;
    }

    // Parse user data
    const userStr = urlParams.get('user');
    if (!userStr) {
      res.status(401).json({ success: false, error: 'User data missing' });
      return;
    }

    const telegramUser = JSON.parse(userStr);
    req.telegramId = telegramUser.id;

    next();
  } catch (error) {
    logger.error('Telegram validation error:', error);
    res.status(401).json({ success: false, error: 'Validation failed' });
  }
}

export async function authenticateUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.telegramId) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    let user = await userService.findByTelegramId(req.telegramId);

    // Dev mode: create test user if not exists
    if (!user && configService.isDevelopment && req.telegramId === DEV_TELEGRAM_ID) {
      logger.debug('Dev mode: creating test user');
      user = await userService.createFromTelegram({
        id: DEV_TELEGRAM_ID,
        is_bot: false,
        username: 'dev_user',
        first_name: 'Dev',
        language_code: 'ru',
      });
      // Give dev user some balance for testing
      await userService.addBalance(user.id, 1000, 'Dev mode initial balance');
    }

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    if (user.isBlocked) {
      res.status(403).json({ success: false, error: 'User is blocked' });
      return;
    }

    req.user = user;
    await userService.updateLastActive(user.id);

    next();
  } catch (error) {
    logger.error('User authentication error:', error);
    res.status(500).json({ success: false, error: 'Authentication failed' });
  }
}
