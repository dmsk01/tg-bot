import { Markup } from 'telegraf';
import type { BotContext } from '../middlewares/auth.middleware.js';
import { t } from '../../common/i18n/i18n.service.js';

export async function balanceHandler(ctx: BotContext): Promise<void> {
  const user = ctx.dbUser;
  if (!user) {
    await ctx.reply('Error: User not found');
    return;
  }

  const lang = user.languageCode;
  const balance = user.balance.toNumber();

  const message = balance > 0
    ? t('bot.balance', { balance: balance.toFixed(2) }, lang)
    : t('bot.balance_empty', {}, lang);

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback(t('buttons.top_up', {}, lang), 'top_up')],
  ]);

  await ctx.reply(message, keyboard);
}
