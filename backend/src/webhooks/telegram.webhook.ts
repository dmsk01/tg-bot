import { Router, Request, Response } from 'express';
import { botService } from '../bot/bot.service.js';
import { logger } from '../common/utils/logger.util.js';

const router = Router();

router.post('/telegram', async (req: Request, res: Response) => {
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
