import { InputFile } from 'grammy';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import type { BotContext } from '../middlewares/auth.middleware.js';
import { t } from '../../common/i18n/i18n.service.js';
import { showMenu } from '../menu/menu.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const WELCOME_IMAGE_PATH = join(__dirname, '..', '..', 'assets', 'welcome.png');

export async function startHandler(ctx: BotContext): Promise<void> {
  const user = ctx.dbUser;
  if (!user) {
    await ctx.reply('Error: User not found');
    return;
  }

  const lang = user.languageCode;
  const name = user.firstName || user.username || 'User';
  const isNewUser = Date.now() - user.createdAt.getTime() < 60000;

  // Show welcome message with image for new users
  if (isNewUser) {
    await ctx.replyWithPhoto(new InputFile(WELCOME_IMAGE_PATH), {
      caption: t('bot.welcome', { name }, lang),
    });
  }

  // Show main menu
  await showMenu(ctx, 'main');
}
