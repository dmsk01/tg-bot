import { Markup } from 'telegraf';
import type { BotContext } from '../middlewares/auth.middleware.js';
import { t } from '../../common/i18n/i18n.service.js';
import { userService } from '../../services/user.service.js';

export async function languageHandler(ctx: BotContext): Promise<void> {
  const user = ctx.dbUser;
  if (!user) {
    await ctx.reply('Error: User not found');
    return;
  }

  const lang = user.languageCode;
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback(t('buttons.russian', {}, lang), 'lang_ru')],
    [Markup.button.callback(t('buttons.english', {}, lang), 'lang_en')],
  ]);

  await ctx.reply(t('bot.choose_language', {}, lang), keyboard);
}

export async function languageCallbackHandler(ctx: BotContext): Promise<void> {
  const user = ctx.dbUser;
  if (!user || !ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
    return;
  }

  const data = ctx.callbackQuery.data;
  const newLang = data === 'lang_ru' ? 'ru' : 'en';

  await userService.updateLanguage(user.id, newLang);
  await ctx.answerCbQuery();
  await ctx.reply(t('bot.language_changed', {}, newLang));
}
