/**
 * Development-only routes for testing without Telegram Mini App.
 * These routes are only available when NODE_ENV=development.
 *
 * Usage:
 * 1. Call POST /api/dev/init-data with desired user data
 * 2. Use the returned initData in x-telegram-init-data header
 */
import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { configService } from '../../common/config/config.service.js';
import { userService } from '../../services/user.service.js';
import { logger } from '../../common/utils/logger.util.js';

const router = Router();

interface DevUserParams {
  id?: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  languageCode?: string;
}

/**
 * Generate valid Telegram initData for testing.
 * POST /api/dev/init-data
 *
 * Body:
 * {
 *   "id": 12345678,           // optional, default: random
 *   "username": "test_user",  // optional
 *   "firstName": "Test",      // optional, default: "Dev"
 *   "lastName": "User",       // optional
 *   "languageCode": "ru"      // optional, default: "ru"
 * }
 *
 * Returns:
 * {
 *   "initData": "user=...&auth_date=...&hash=...",
 *   "user": { ... }
 * }
 */
router.post('/init-data', async (req: Request, res: Response) => {
  const params: DevUserParams = req.body || {};

  const telegramId = params.id || Math.floor(Math.random() * 900000000) + 100000000;

  const telegramUser = {
    id: telegramId,
    first_name: params.firstName || 'Dev',
    last_name: params.lastName || '',
    username: params.username || `dev_user_${telegramId}`,
    language_code: params.languageCode || 'ru',
    is_premium: false,
    allows_write_to_pm: true,
  };

  const authDate = Math.floor(Date.now() / 1000);

  // Build data check string
  const dataObj: Record<string, string> = {
    auth_date: authDate.toString(),
    user: JSON.stringify(telegramUser),
  };

  const dataCheckArr = Object.entries(dataObj)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`);
  const dataCheckString = dataCheckArr.join('\n');

  // Calculate hash using bot token
  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(configService.telegram.botToken)
    .digest();

  const hash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  // Build initData string
  const initDataParams = new URLSearchParams({
    ...dataObj,
    hash,
  });
  const initData = initDataParams.toString();

  // Create or get user in database
  let user = await userService.findByTelegramId(telegramId);
  if (!user) {
    user = await userService.createFromTelegram({
      id: telegramId,
      is_bot: false,
      username: telegramUser.username,
      first_name: telegramUser.first_name,
      last_name: telegramUser.last_name,
      language_code: telegramUser.language_code,
    });
    // Give dev user some balance for testing
    await userService.addBalance(user.id, 100, 'Dev mode initial balance');
    logger.info(`Dev user created: ${telegramId}`);
  }

  res.json({
    success: true,
    initData,
    user: {
      id: user.id,
      telegramId: user.telegramId.toString(),
      username: user.username,
      firstName: user.firstName,
      balance: user.balance,
    },
    usage: 'Add to request header: x-telegram-init-data: <initData>',
  });
});

/**
 * Get current dev user info.
 * GET /api/dev/whoami
 * Header: x-telegram-init-data
 */
router.get('/whoami', async (req: Request, res: Response) => {
  const initData = req.headers['x-telegram-init-data'] as string;

  if (!initData) {
    res.status(400).json({
      success: false,
      error: 'Missing x-telegram-init-data header',
      hint: 'Call POST /api/dev/init-data first to get initData',
    });
    return;
  }

  const urlParams = new URLSearchParams(initData);
  const userStr = urlParams.get('user');

  if (!userStr) {
    res.status(400).json({ success: false, error: 'Invalid initData' });
    return;
  }

  const telegramUser = JSON.parse(userStr);
  const user = await userService.findByTelegramId(telegramUser.id);

  res.json({
    success: true,
    telegramUser,
    dbUser: user,
  });
});

export default router;
