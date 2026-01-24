import { Bot } from 'grammy';
import { configService } from '../common/config/config.service.js';
import { logger } from '../common/utils/logger.util.js';
import { authMiddleware, type BotContext } from './middlewares/auth.middleware.js';
import { startHandler } from './handlers/start.handler.js';
import { balanceHandler } from './handlers/balance.handler.js';
import { languageHandler, languageCallbackHandler } from './handlers/language.handler.js';
import { helpHandler } from './handlers/help.handler.js';
import { appHandler } from './handlers/app.handler.js';
import en from '../common/i18n/locales/en.json' with { type: 'json' };
import ru from '../common/i18n/locales/ru.json' with { type: 'json' };

class BotService {
  private bot: Bot<BotContext>;

  constructor() {
    this.bot = new Bot<BotContext>(configService.telegram.botToken);
    this.setupMiddlewares();
    this.setupHandlers();
  }

  private setupMiddlewares(): void {
    // Auth middleware - создает/получает пользователя из БД
    this.bot.use(authMiddleware);

    // Error handling
    this.bot.catch((err) => {
      const updateType = Object.keys(err.ctx.update).find((k) => k !== 'update_id') || 'unknown';
      logger.error(`Bot error for ${updateType}:`, err.error);
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
    this.bot.callbackQuery(/^lang_(ru|en)$/, languageCallbackHandler);

    // Top up callback (placeholder for MVP)
    this.bot.callbackQuery('top_up', async (ctx) => {
      await ctx.answerCallbackQuery('Payment system coming soon!');
    });

    logger.info('Bot handlers registered');
  }

  private async setupCommands(): Promise<void> {
    const commands = [
      { command: 'start', description: en.commands.start },
      { command: 'balance', description: en.commands.balance },
      { command: 'app', description: en.commands.app },
      { command: 'language', description: en.commands.language },
      { command: 'help', description: en.commands.help },
    ];

    const commandsRu = [
      { command: 'start', description: ru.commands.start },
      { command: 'balance', description: ru.commands.balance },
      { command: 'app', description: ru.commands.app },
      { command: 'language', description: ru.commands.language },
      { command: 'help', description: ru.commands.help },
    ];

    // Set default commands (English)
    await this.bot.api.setMyCommands(commands);

    // Set Russian commands for Russian-speaking users
    await this.bot.api.setMyCommands(commandsRu, {
      language_code: 'ru',
    });

    logger.info('Bot commands menu configured');
  }

  getBot(): Bot<BotContext> {
    return this.bot;
  }

  async setWebhook(url: string): Promise<void> {
    try {
      await this.bot.api.setWebhook(url);
      logger.info(`Webhook set to: ${url}`);
    } catch (error) {
      logger.error('Failed to set webhook:', error);
      throw error;
    }
  }

  async deleteWebhook(): Promise<void> {
    try {
      await this.bot.api.deleteWebhook({ drop_pending_updates: true });
      logger.info('Webhook deleted');
    } catch (error) {
      logger.warn('Failed to delete webhook (will continue anyway):', error instanceof Error ? error.message : error);
    }
  }

  async launch(): Promise<void> {
    const webhookUrl = configService.telegram.webhookUrl;

    if (webhookUrl) {
      // Webhook mode - need to init bot first for handleUpdate to work
      await this.bot.init();
      await this.setupCommands();
      await this.setWebhook(`${webhookUrl}`);
      logger.info('Bot running in webhook mode');
    } else {
      // Polling mode (development)
      await this.deleteWebhook();
      await this.bot.init();
      await this.setupCommands();

      // Launch with timeout
      const launchWithTimeout = async (timeoutMs: number = 15000) => {
        return Promise.race([
          this.bot.start({
            drop_pending_updates: true,
            allowed_updates: ['message', 'callback_query'],
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
      this.bot.stop();
    } catch {
      // Bot might not be running, ignore
    }
  }
}

export const botService = new BotService();
