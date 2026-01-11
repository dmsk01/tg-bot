import { Telegraf } from 'telegraf';
import { configService } from '../common/config/config.service.js';
import { logger } from '../common/utils/logger.util.js';
import { authMiddleware, type BotContext } from './middlewares/auth.middleware.js';
import { startHandler } from './handlers/start.handler.js';
import { balanceHandler } from './handlers/balance.handler.js';
import { languageHandler, languageCallbackHandler } from './handlers/language.handler.js';
import { helpHandler } from './handlers/help.handler.js';
import { appHandler } from './handlers/app.handler.js';

class BotService {
  private bot: Telegraf<BotContext>;

  constructor() {
    this.bot = new Telegraf<BotContext>(configService.telegram.botToken);
    this.setupMiddlewares();
    this.setupHandlers();
  }

  private setupMiddlewares(): void {
    // Auth middleware - создает/получает пользователя из БД
    this.bot.use(authMiddleware);

    // Error handling
    this.bot.catch((err, ctx) => {
      logger.error(`Bot error for ${ctx.updateType}:`, err);
    });
  }

  private setupHandlers(): void {
    // Commands
    this.bot.command('start', startHandler);
    this.bot.command('balance', balanceHandler);
    this.bot.command('language', languageHandler);
    this.bot.command('help', helpHandler);
    this.bot.command('app', appHandler);

    // Callback queries
    this.bot.action(/^lang_(ru|en)$/, languageCallbackHandler);

    // Top up callback (placeholder for MVP)
    this.bot.action('top_up', async (ctx) => {
      await ctx.answerCbQuery('Payment system coming soon!');
    });

    logger.info('Bot handlers registered');
  }

  getBot(): Telegraf<BotContext> {
    return this.bot;
  }

  async setWebhook(url: string): Promise<void> {
    try {
      await this.bot.telegram.setWebhook(url);
      logger.info(`Webhook set to: ${url}`);
    } catch (error) {
      logger.error('Failed to set webhook:', error);
      throw error;
    }
  }

  async deleteWebhook(): Promise<void> {
    try {
      await this.bot.telegram.deleteWebhook({ drop_pending_updates: true });
      logger.info('Webhook deleted');
    } catch (error) {
      logger.warn('Failed to delete webhook (will continue anyway):', error instanceof Error ? error.message : error);
    }
  }

  async launch(): Promise<void> {
    const webhookUrl = configService.telegram.webhookUrl;

    if (webhookUrl) {
      // Webhook mode
      await this.setWebhook(`${webhookUrl}`);
      logger.info('Bot running in webhook mode');
    } else {
      // Polling mode (development)
      await this.deleteWebhook();

      // Launch with timeout
      const launchWithTimeout = async (timeoutMs: number = 15000) => {
        return Promise.race([
          this.bot.launch({
            dropPendingUpdates: true,
            allowedUpdates: ['message', 'callback_query'],
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Bot launch timeout')), timeoutMs)
          ),
        ]);
      };

      try {
        await launchWithTimeout();
        logger.info('Bot running in polling mode');
      } catch (error) {
        if (error instanceof Error && error.message.includes('timeout')) {
          logger.warn('Bot launch timed out, but bot may still be operational');
          logger.info('Bot running in polling mode (with delayed start)');
        } else {
          logger.error('Failed to launch bot:', error instanceof Error ? error.message : error);
          throw error;
        }
      }
    }
  }

  async stop(): Promise<void> {
    try {
      this.bot.stop('SIGTERM');
    } catch {
      // Bot might not be running, ignore
    }
  }
}

export const botService = new BotService();
