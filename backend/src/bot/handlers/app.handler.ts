import { InlineKeyboard } from 'grammy';
import type { BotContext } from '../middlewares/auth.middleware.js';
import { t } from '../../common/i18n/i18n.service.js';
import { configService } from '../../common/config/config.service.js';

export async function appHandler(ctx: BotContext): Promise<void> {
  const user = ctx.dbUser;
  if (!user) {
    await ctx.reply('Error: User not found');
    return;
  }

  const lang = user.languageCode;
  const miniAppUrl = configService.telegram.miniAppUrl || 'https://example.com';

  const keyboard = new InlineKeyboard()
    .webApp(t('bot.open_app', {}, lang), miniAppUrl);

  await ctx.reply(t('bot.open_app', {}, lang), { reply_markup: keyboard });
}
