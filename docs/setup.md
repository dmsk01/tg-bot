# Установка и настройка

[← Назад к оглавлению](./README.md) | [← Frontend](./frontend.md)

## Требования

- **Node.js** 20.x или выше
- **PostgreSQL** 14+
- **Redis** 6+ (для очередей)
- **npm** или **yarn**

## Шаг 1: Клонирование

```bash
git clone <repository-url>
cd postcard_bot
```

## Шаг 2: Установка зависимостей

### Backend

```bash
cd backend
npm install
```

### Frontend

```bash
cd frontend
npm install
```

## Шаг 3: Настройка PostgreSQL

```bash
# Подключение к PostgreSQL
psql -U postgres

# Создание базы данных
CREATE DATABASE postcard_bot;

# Опционально: создать пользователя
CREATE USER postcard_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE postcard_bot TO postcard_user;

\q
```

## Шаг 4: Настройка Redis

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Проверка
redis-cli ping  # Должен вернуть: PONG
```

## Шаг 5: Переменные окружения

### Backend (.env)

```bash
cd backend
cp .env.example .env
```

```env
# Environment
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/postcard_bot

# Telegram (получить от @BotFather)
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_WEBHOOK_URL=  # Пусто для polling режима
MINI_APP_URL=http://localhost:5173  # Для Mini App нужен HTTPS! См. ngrok.md

# Redis
REDIS_URL=redis://localhost:6379

# Kandinsky API (подключить позже)
KANDINSKY_API_KEY=
KANDINSKY_SECRET_KEY=

# YooKassa (подключить позже)
YOOKASSA_SHOP_ID=
YOOKASSA_SECRET_KEY=

# Storage
UPLOAD_DIR=./uploads
GENERATED_DIR=./generated
MAX_FILE_SIZE=10485760

# Costs
GENERATION_COST=10.00

# JWT
JWT_SECRET=your_super_secret_jwt_key

# Logging
LOG_LEVEL=info

# Bot settings
DISABLE_BOT=false  # Установить true для отключения бота (только API)
```

### Frontend (.env)

```bash
cd frontend
cp .env.example .env
```

```env
VITE_API_URL=http://localhost:3000
VITE_TELEGRAM_BOT_USERNAME=@your_bot_username
```

### Dev режим (автоматическая авторизация)

В режиме `NODE_ENV=development` backend автоматически:
- Пропускает валидацию Telegram initData
- Создаёт тестового пользователя (telegramId: 12345678) с балансом 1000 руб
- Позволяет тестировать в браузере без Telegram

Это удобно для разработки UI без настройки туннелей.

## Шаг 6: Создание Telegram бота

1. Откройте [@BotFather](https://t.me/BotFather)
2. Отправьте `/newbot`
3. Введите имя бота (например: "Postcard Generator")
4. Введите username (например: "poctcard_bot")
5. Скопируйте токен в `backend/.env`

## Шаг 7: Миграции и seed

```bash
cd backend

# Генерация Prisma Client
npm run prisma:generate

# Создание миграции
npm run prisma:migrate

# Заполнение начальными данными
npm run prisma:seed

# Опционально: просмотр данных
npm run prisma:studio
```

## Шаг 8: Запуск

### Backend

```bash
cd backend
npm run dev
```

Сервер на http://localhost:3000

Проверка:
```bash
curl http://localhost:3000/health
```

### Frontend

```bash
cd frontend
npm run dev
```

Приложение на http://localhost:5173

## Шаг 9: Проверка бота

1. Откройте Telegram
2. Найдите вашего бота
3. Отправьте `/start`
4. Бот должен ответить приветствием

---

## Конфигурация

### Backend Environment Variables

| Переменная | Описание | Обязательна | По умолчанию |
|-----------|----------|-------------|--------------|
| `NODE_ENV` | Окружение | Нет | development |
| `PORT` | Порт сервера | Нет | 3000 |
| `DATABASE_URL` | PostgreSQL connection string | **Да** | - |
| `TELEGRAM_BOT_TOKEN` | Токен от @BotFather | **Да** | - |
| `TELEGRAM_WEBHOOK_URL` | URL для webhook | Нет | - |
| `MINI_APP_URL` | URL Mini App | Нет | - |
| `REDIS_URL` | Redis connection string | Нет | redis://localhost:6379 |
| `KANDINSKY_API_KEY` | API ключ Kandinsky | При генерации | - |
| `KANDINSKY_SECRET_KEY` | Secret ключ Kandinsky | При генерации | - |
| `YOOKASSA_SHOP_ID` | ID магазина ЮKassa | При оплате | - |
| `YOOKASSA_SECRET_KEY` | Secret ключ ЮKassa | При оплате | - |
| `UPLOAD_DIR` | Директория загрузок | Нет | ./uploads |
| `GENERATED_DIR` | Директория генераций | Нет | ./generated |
| `MAX_FILE_SIZE` | Макс. размер файла | Нет | 10485760 (10MB) |
| `GENERATION_COST` | Стоимость генерации | Нет | 10.00 |
| `JWT_SECRET` | Секрет для JWT | **Да** | - |
| `LOG_LEVEL` | Уровень логирования | Нет | info |
| `DISABLE_BOT` | Отключить Telegram бота | Нет | false |

> **Важно**: `MINI_APP_URL` должен быть HTTPS для работы кнопки Mini App в Telegram. Для локальной разработки используйте [Cloudflare Tunnel или ngrok](./ngrok.md). Также можно тестировать в браузере без туннеля через Dev режим.

### Frontend Environment Variables

| Переменная | Описание | Обязательна |
|-----------|----------|-------------|
| `VITE_API_URL` | URL backend API | **Да** |
| `VITE_TELEGRAM_BOT_USERNAME` | Username бота | **Да** |

---

## Полезные команды

### Backend

```bash
# Development
npm run dev              # Запуск с hot reload
npm run build            # Сборка TypeScript
npm start                # Запуск production

# Prisma
npm run prisma:generate  # Генерация Prisma Client
npm run prisma:migrate   # Создать миграцию
npm run prisma:studio    # Открыть Prisma Studio
npm run prisma:seed      # Заполнить БД

# Качество кода
npm run lint             # Проверка ESLint
npm run lint:fix         # Автофикс ESLint
npm run format           # Форматирование Prettier
```

### Frontend

```bash
npm run dev              # Запуск dev сервера
npm run build            # Сборка для production
npm run preview          # Предпросмотр build
npm run lint             # Проверка ESLint
```

### PM2 (Production)

```bash
pm2 start ecosystem.config.js  # Запуск
pm2 stop postcard-bot          # Остановка
pm2 restart postcard-bot       # Перезапуск
pm2 logs postcard-bot          # Логи
pm2 monit                      # Мониторинг
pm2 save                       # Сохранить состояние
```

---

[Локальная разработка с ngrok →](./ngrok.md)
