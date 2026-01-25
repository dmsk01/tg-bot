import { Response } from 'express';
import type { AuthenticatedRequest } from '../middlewares/validate-telegram.middleware.js';
import { userService } from '../../services/user.service.js';
import { botService } from '../../bot/bot.service.js';
import { sseService } from '../../services/sse.service.js';

export class UserController {
  async getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
    const user = req.user!;

    res.json({
      success: true,
      data: {
        id: user.id,
        telegramId: user.telegramId.toString(),
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        languageCode: user.languageCode,
        isAgeConfirmed: user.isAgeConfirmed,
        balance: user.balance.toNumber(),
        createdAt: user.createdAt,
      },
    });
  }

  async getBalance(req: AuthenticatedRequest, res: Response): Promise<void> {
    const balance = await userService.getBalance(req.user!.id);

    res.json({
      success: true,
      data: { balance },
    });
  }

  async getSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    const settings = await userService.getSettings(req.user!.id);

    res.json({
      success: true,
      data: settings,
    });
  }

  async updateSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { defaultModel, defaultAspectRatio, notificationsEnabled } = req.body;

    const settings = await userService.updateSettings(req.user!.id, {
      defaultModel,
      defaultAspectRatio,
      notificationsEnabled,
    });

    res.json({
      success: true,
      data: settings,
    });
  }

  async updateLanguage(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { languageCode } = req.body;

    if (!['ru', 'en'].includes(languageCode)) {
      res.status(400).json({
        success: false,
        error: 'Invalid language code. Use "ru" or "en".',
      });
      return;
    }

    const user = await userService.updateLanguage(req.user!.id, languageCode);

    // Update bot command menu for this user
    await botService.setUserCommands(Number(req.user!.telegramId), languageCode);

    res.json({
      success: true,
      data: { languageCode: user.languageCode },
    });
  }

  async confirmAge(req: AuthenticatedRequest, res: Response): Promise<void> {
    const user = await userService.confirmAge(req.user!.id);

    res.json({
      success: true,
      data: { isAgeConfirmed: user.isAgeConfirmed },
    });
  }

  subscribeToLanguageEvents(req: AuthenticatedRequest, res: Response): void {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    sseService.addConnection(req.user!.id, res);

    const heartbeat = setInterval(() => {
      res.write(':heartbeat\n\n');
    }, 30000);

    res.on('close', () => {
      clearInterval(heartbeat);
    });
  }
}

export const userController = new UserController();
