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

## Настройка в BotFather

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
