# Локальная разработка с туннелями

[← Назад к оглавлению](./README.md) | [← Установка](./setup.md)

Для работы Mini App в Telegram необходим HTTPS. Есть несколько вариантов:
1. **Dev режим** — тестирование в браузере без Telegram (рекомендуется для начала)
2. **Cloudflare Tunnel** — бесплатный и стабильный (рекомендуется для Telegram)
3. **ngrok** — популярный, но менее стабильный на бесплатном плане

---

## Dev режим (без туннеля)

В режиме разработки (`NODE_ENV=development`) backend автоматически:
- Пропускает валидацию Telegram initData
- Создаёт тестового пользователя с балансом 1000 руб
- Позволяет тестировать API без Telegram

### Использование

1. Убедитесь что в `backend/.env`:
```env
NODE_ENV=development
# TELEGRAM_WEBHOOK_URL=  # Закомментировано или пусто
```

2. В `frontend/.env`:
```env
VITE_API_URL=http://localhost:3000
```

3. Запустите backend и frontend
4. Откройте http://localhost:5173 в браузере

Это самый простой способ тестировать UI и API без настройки туннелей.

---

## Cloudflare Tunnel (рекомендуется)

Cloudflare Tunnel бесплатный, стабильный и не требует регистрации для быстрого старта.

### Установка

```bash
# Скачивание
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
chmod +x cloudflared

# Или через пакетный менеджер (Ubuntu/Debian)
curl -L https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-archive-keyring.gpg >/dev/null
echo "deb [signed-by=/usr/share/keyrings/cloudflare-archive-keyring.gpg] https://pkg.cloudflare.com/cloudflared $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/cloudflared.list
sudo apt update && sudo apt install cloudflared
```

### Запуск туннеля

```bash
./cloudflared tunnel --url http://localhost:3000
```

Туннель выдаст URL вида:
```
https://xxxx-xxxx-xxxx-chosen.trycloudflare.com
```

### Настройка .env

**Backend (.env)**:
```env
TELEGRAM_WEBHOOK_URL=https://xxxx-xxxx.trycloudflare.com/webhook/telegram
MINI_APP_URL=https://xxxx-xxxx.trycloudflare.com
```

**Frontend (.env)**:
```env
VITE_API_URL=https://xxxx-xxxx.trycloudflare.com
```

### Установка webhook

После обновления .env и перезапуска backend, webhook установится автоматически.

Или вручную:
```bash
curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://xxxx.trycloudflare.com/webhook/telegram"
```

---

## ngrok (альтернатива)

### Установка

```bash
# Ubuntu/Debian
curl -sSL https://ngrok-agent.s3.amazonaws.com/ngrok.asc \
  | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null \
  && echo "deb https://ngrok-agent.s3.amazonaws.com buster main" \
  | sudo tee /etc/apt/sources.list.d/ngrok.list \
  && sudo apt update \
  && sudo apt install ngrok

# Snap
sudo snap install ngrok
```

### Настройка

1. Зарегистрируйтесь на [ngrok.com](https://ngrok.com)
2. Получите authtoken в личном кабинете
3. Авторизуйте:

```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

### Запуск

```bash
ngrok http 3000
```

### Настройка .env

Аналогично Cloudflare Tunnel — обновите URL в backend/.env и frontend/.env.

### Ограничения бесплатного плана

- 40 соединений/мин (может вызывать ошибки 429)
- URL меняется при перезапуске
- Иногда нестабильное соединение

---

## Проверка webhook

```bash
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
```

Успешный ответ:
```json
{
  "ok": true,
  "result": {
    "url": "https://xxxx.trycloudflare.com/webhook/telegram",
    "pending_update_count": 0
  }
}
```

## Удаление webhook (переход на polling)

```bash
curl "https://api.telegram.org/bot<TOKEN>/deleteWebhook"
```

Также закомментируйте `TELEGRAM_WEBHOOK_URL` в `backend/.env`.

---

## Сравнение вариантов

| Вариант | Для чего | Плюсы | Минусы |
|---------|----------|-------|--------|
| Dev режим | UI/API в браузере | Не нужен туннель | Не работает в Telegram |
| Cloudflare | Полное тестирование | Бесплатный, стабильный | URL меняется при перезапуске |
| ngrok | Полное тестирование | Популярный | Лимиты, нестабильность |

**Рекомендация**: Начните с Dev режима для разработки UI, затем используйте Cloudflare Tunnel для тестирования в Telegram.

---

[Деплой →](./deploy.md)
