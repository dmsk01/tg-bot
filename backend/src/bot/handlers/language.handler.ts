import { InlineKeyboard } from 'grammy';
import type { BotContext } from '../middlewares/auth.middleware.js';
import { t } from '../../common/i18n/i18n.service.js';
import { userService } from '../../services/user.service.js';
import { botService } from '../bot.service.js';

export async function languageHandler(ctx: BotContext): Promise<void> {
  const user = ctx.dbUser;
  if (!user) {
    await ctx.reply('Error: User not found');
    return;
  }

  const lang = user.languageCode;
  const keyboard = new InlineKeyboard()
    .text(t('buttons.russian', {}, lang), 'lang_ru')
    .row()
    .text(t('buttons.english', {}, lang), 'lang_en');

  await ctx.reply(t('bot.choose_language', {}, lang), { reply_markup: keyboard });
}

export async function languageCallbackHandler(ctx: BotContext): Promise<void> {
  const user = ctx.dbUser;
  if (!user || !ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
    return;
  }

  const data = ctx.callbackQuery.data;
  const newLang = data === 'lang_ru' ? 'ru' : 'en';

  await userService.updateLanguage(user.id, newLang);
  await botService.setUserCommands(ctx.chat!.id, newLang);
  await ctx.answerCallbackQuery();
  await ctx.reply(t('bot.language_changed', {}, newLang));
}
