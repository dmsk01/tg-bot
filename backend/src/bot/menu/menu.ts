import { InlineKeyboard } from 'grammy';
import type { BotContext } from '../middlewares/auth.middleware.js';
import { t } from '../../common/i18n/i18n.service.js';
import { configService } from '../../common/config/config.service.js';

export type MenuType = 'main' | 'balance' | 'settings' | 'language' | 'help';

export function getMenuText(menu: MenuType, ctx: BotContext): string {
  const user = ctx.dbUser!;
  const lang = user.languageCode;
  const name = user.firstName || user.username || 'User';

  switch (menu) {
    case 'main':
      return t('menu.main', { name }, lang);
    case 'balance': {
      const balance = user.balance.toNumber();
      return balance > 0
        ? t('bot.balance', { balance: balance.toFixed(2) }, lang)
        : t('bot.balance_empty', {}, lang);
    }
    case 'settings':
      return t('menu.settings', {}, lang);
    case 'language':
      return t('bot.choose_language', {}, lang);
    case 'help':
      return t('bot.help', {}, lang);
    default:
      return '';
  }
}

export function getMenuKeyboard(menu: MenuType, ctx: BotContext): InlineKeyboard {
  const user = ctx.dbUser!;
  const lang = user.languageCode;
  const keyboard = new InlineKeyboard();

  switch (menu) {
    case 'main': {
      const miniAppUrl = configService.telegram.miniAppUrl;
      if (miniAppUrl && miniAppUrl.startsWith('https://')) {
        keyboard.webApp(t('bot.open_app', {}, lang), miniAppUrl).row();
      }
      keyboard
        .text(t('menu.balance_btn', {}, lang), 'menu:balance')
        .text(t('menu.settings_btn', {}, lang), 'menu:settings')
        .row()
        .text(t('menu.help_btn', {}, lang), 'menu:help');
      break;
    }
    case 'balance':
      keyboard
        .text(t('buttons.top_up', {}, lang), 'top_up')
        .row()
        .text(t('menu.back', {}, lang), 'menu:main');
      break;
    case 'settings':
      keyboard
        .text(t('menu.language_btn', {}, lang), 'menu:language')
        .row()
        .text(t('menu.back', {}, lang), 'menu:main');
      break;
    case 'language':
      keyboard
        .text(t('buttons.russian', {}, lang), 'lang_ru')
        .text(t('buttons.english', {}, lang), 'lang_en')
        .row()
        .text(t('menu.back', {}, lang), 'menu:settings');
      break;
    case 'help':
      keyboard.text(t('menu.back', {}, lang), 'menu:main');
      break;
  }

  return keyboard;
}

export async function showMenu(ctx: BotContext, menu: MenuType, isEdit = false): Promise<void> {
  const text = getMenuText(menu, ctx);
  const keyboard = getMenuKeyboard(menu, ctx);

  if (isEdit && ctx.callbackQuery) {
    await ctx.editMessageText(text, { reply_markup: keyboard });
  } else {
    await ctx.reply(text, { reply_markup: keyboard });
  }
}

export async function navigateToMenu(ctx: BotContext, menu: MenuType): Promise<void> {
  await ctx.answerCallbackQuery();
  await showMenu(ctx, menu, true);
}
