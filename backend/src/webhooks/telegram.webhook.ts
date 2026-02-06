import { Router, Request, Response, NextFunction } from 'express';
import { botService } from '../bot/bot.service.js';
import { configService } from '../common/config/config.service.js';
import { logger } from '../common/utils/logger.util.js';

const router = Router();

/**
 * Middleware to validate Telegram webhook secret token.
 * Telegram sends the secret token in X-Telegram-Bot-Api-Secret-Token header.
 * @see https://core.telegram.org/bots/api#setwebhook
 */
function validateWebhookSecret(req: Request, res: Response, next: NextFunction): void {
  const webhookSecret = configService.telegram.webhookSecret;

  // If no secret configured, log warning but allow (for backward compatibility during migration)
  if (!webhookSecret) {
    logger.warn('TELEGRAM_WEBHOOK_SECRET not configured - webhook requests are not validated!');
    next();
    return;
  }

  const receivedToken = req.headers['x-telegram-bot-api-secret-token'];

  if (receivedToken !== webhookSecret) {
    logger.warn('Invalid webhook secret token received', {
      ip: req.ip || req.socket.remoteAddress,
      hasToken: !!receivedToken,
    });
    res.sendStatus(403);
    return;
  }

  next();
}

router.post('/telegram', validateWebhookSecret, async (req: Request, res: Response) => {
  try {
    const bot = botService.getBot();
    await bot.handleUpdate(req.body);
    res.sendStatus(200);
  } catch (error) {
    logger.error('Telegram webhook error:', error);
    res.sendStatus(500);
  }
});

export default router;
