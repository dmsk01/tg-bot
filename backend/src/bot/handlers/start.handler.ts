import { Markup } from 'telegraf';
import type { BotContext } from '../middlewares/auth.middleware.js';
import { t } from '../../common/i18n/i18n.service.js';
import { configService } from '../../common/config/config.service.js';

export async function startHandler(ctx: BotContext): Promise<void> {
  const user = ctx.dbUser;
  if (!user) {
    await ctx.reply('Error: User not found');
    return;
  }

  const lang = user.languageCode;
  const name = user.firstName || user.username || 'User';
  const isNewUser = Date.now() - user.createdAt.getTime() < 60000;

  const welcomeKey = isNewUser ? 'bot.welcome' : 'bot.welcome_registered';
  const message = t(welcomeKey, { name }, lang);

  // Build keyboard buttons
  const buttons = [];

  // Mini App button only works with HTTPS URLs (Telegram requirement)
  const miniAppUrl = configService.telegram.miniAppUrl;
  if (miniAppUrl && miniAppUrl.startsWith('https://')) {
    buttons.push([Markup.button.webApp(t('bot.open_app', {}, lang), miniAppUrl)]);
  }

  buttons.push([Markup.button.callback(t('buttons.top_up', {}, lang), 'top_up')]);

  const keyboard = Markup.inlineKeyboard(buttons);

  await ctx.reply(message, keyboard);

  // If new user, show balance
  if (isNewUser) {
    const balance = user.balance.toNumber();
    await ctx.reply(t('bot.balance', { balance: balance.toFixed(2) }, lang));
  }
}
