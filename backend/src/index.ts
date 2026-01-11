import app from './app.js';
import { configService } from './common/config/config.service.js';
import { logger } from './common/utils/logger.util.js';
import { botService } from './bot/bot.service.js';
import { prisma } from './database/prisma/client.js';
import './common/i18n/i18n.service.js';

async function bootstrap() {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('Database connected');

    // Start Express server
    const port = configService.port;
    app.listen(port, () => {
      logger.info(`Server running on port ${port}`);
      logger.info(`Environment: ${configService.env.NODE_ENV}`);
    });

    // Launch Telegram bot
    if (!configService.disableBot) {
      await botService.launch();
      logger.info('Telegram bot started');
    } else {
      logger.warn('Telegram bot is disabled via DISABLE_BOT env variable');
    }

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down...`);

      await botService.stop();
      await prisma.$disconnect();

      process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    logger.error('Failed to start application:', error);
    process.exit(1);
  }
}

bootstrap();
