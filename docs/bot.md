# Telegram бот

[← Назад к оглавлению](./README.md) | [← REST API](./api.md)

## Команды бота

| Команда | Описание |
|---------|----------|
| `/start` | Регистрация, приветствие |
| `/balance` | Показать баланс |
| `/app` | Открыть Mini App |
| `/language` | Выбор языка (ru/en) |
| `/help` | Справка |

## Меню команд

Бот автоматически устанавливает меню команд при запуске через `setMyCommands`:
- **По умолчанию** — английские описания
- **Для русскоязычных пользователей** — русские описания (по `language_code: 'ru'`)

При смене языка через `/language` меню обновляется персонально для пользователя с помощью `scope: { type: 'chat', chat_id }`.

Описания команд хранятся в файлах локализации:
- `backend/src/common/i18n/locales/ru.json` → секция `commands`
- `backend/src/common/i18n/locales/en.json` → секция `commands`

## Настройка в BotFather (опционально)

Команды устанавливаются программно, но можно также задать вручную:

```
/setdescription
Бот для генерации изображений с помощью нейросети Kandinsky

/setcommands
start - Начать работу с ботом
balance - Проверить баланс
app - Открыть редактор изображений
language - Сменить язык
help - Помощь
```

## Фреймворк grammY

Бот использует [grammY](https://grammy.dev/) — современный TypeScript фреймворк для Telegram ботов.

### Особенности grammY

**Webhook режим требует инициализации:**
```typescript
// В webhook режиме нужно вызвать bot.init() перед обработкой запросов
await bot.init();
await bot.api.setWebhook(webhookUrl);
```

**Основные отличия от Telegraf:**
| Telegraf | grammY |
|----------|--------|
| `bot.action(pattern, handler)` | `bot.callbackQuery(pattern, handler)` |
| `bot.launch()` | `bot.start()` |
| `Markup.inlineKeyboard([...])` | `new InlineKeyboard().text().row()` |
| `ctx.reply(msg, keyboard)` | `ctx.reply(msg, { reply_markup: keyboard })` |
| `ctx.answerCbQuery()` | `ctx.answerCallbackQuery()` |
| `bot.telegram.setWebhook()` | `bot.api.setWebhook()` |

**Пример создания клавиатуры:**
```typescript
import { InlineKeyboard } from 'grammy';

const keyboard = new InlineKeyboard()
  .text('Кнопка 1', 'callback_1')
  .row()
  .text('Кнопка 2', 'callback_2')
  .webApp('Открыть приложение', 'https://example.com');

await ctx.reply('Выберите действие:', { reply_markup: keyboard });
```

## Структура кода

```
backend/src/bot/
├── handlers/
│   ├── start.handler.ts      # /start
│   ├── balance.handler.ts    # /balance
│   ├── language.handler.ts   # /language + callbacks
│   ├── help.handler.ts       # /help
│   └── app.handler.ts        # /app
├── middlewares/
│   └── auth.middleware.ts    # Создание/получение пользователя
└── bot.service.ts            # Основной сервис
```

## Режимы работы

### Polling (разработка)

Бот запрашивает обновления у Telegram API.

```env
# .env
TELEGRAM_WEBHOOK_URL=  # оставить пустым
```

### Webhook (production)

Telegram отправляет обновления на ваш сервер.

```env
# .env
TELEGRAM_WEBHOOK_URL=https://api.yourdomain.com/webhook/telegram
```

## Локализация

Бот поддерживает русский и английский языки.

Файлы переводов:
- `backend/src/common/i18n/locales/ru.json`
- `backend/src/common/i18n/locales/en.json`

Пример использования:

```typescript
import { t } from '../common/i18n/i18n.service.js';

// В хендлере
const message = t('bot.welcome', { name: user.firstName }, user.languageCode);
await ctx.reply(message);
```

## Ключевые файлы

- `backend/src/bot/bot.service.ts` - регистрация команд и middleware
- `backend/src/bot/handlers/start.handler.ts` - обработка /start
- `backend/src/bot/middlewares/auth.middleware.ts` - аутентификация
- `backend/src/webhooks/telegram.webhook.ts` - webhook endpoint

---

[Mini App Frontend →](./frontend.md)
