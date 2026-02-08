import type { BotContext } from '../middlewares/auth.middleware.js';
import { t } from '../../common/i18n/i18n.service.js';
import { userService } from '../../services/user.service.js';
import { botService } from '../bot.service.js';
import { showMenu } from '../menu/menu.js';

export async function languageHandler(ctx: BotContext): Promise<void> {
  const user = ctx.dbUser;
  if (!user) {
    await ctx.reply('Error: User not found');
    return;
  }

  await showMenu(ctx, 'language');
}

export async function languageCallbackHandler(ctx: BotContext): Promise<void> {
  const user = ctx.dbUser;
  if (!user || !ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
    return;
  }

  const data = ctx.callbackQuery.data;
  const newLang = data === 'lang_ru' ? 'ru' : 'en';

  await userService.updateLanguage(user.id, newLang);

  // Update user in context with new language
  ctx.dbUser = { ...user, languageCode: newLang };

  await botService.setUserCommands(ctx.chat!.id, newLang);

  // Navigate back to settings menu with updated language and show toast
  await ctx.answerCallbackQuery(t('bot.language_changed', {}, newLang));
  await showMenu(ctx, 'settings', true);
}
