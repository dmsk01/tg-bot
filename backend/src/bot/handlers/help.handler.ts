import type { BotContext } from '../middlewares/auth.middleware.js';
import { t } from '../../common/i18n/i18n.service.js';

export async function helpHandler(ctx: BotContext): Promise<void> {
  const user = ctx.dbUser;
  const lang = user?.languageCode || 'ru';

  await ctx.reply(t('bot.help', {}, lang));
}
