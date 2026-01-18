# CI/CD Стратегия для Postcard Bot

## Обзор

Этот документ описывает полную стратегию Continuous Integration и Continuous Deployment для проекта Postcard Bot с использованием GitHub Actions.

## Архитектура деплоя

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              VPS Ubuntu 24                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐     ┌──────────────────────────────────────────────────┐  │
│  │   Nginx     │────▶│              Frontend (React)                    │  │
│  │   (SSL)     │     │         /var/www/postcard-bot/frontend/dist      │  │
│  │   :443      │     └──────────────────────────────────────────────────┘  │
│  │             │                                                            │
│  │             │     ┌──────────────────────────────────────────────────┐  │
│  │  /api/*     │────▶│              Backend (Node.js + grammY)          │  │
│  │  /webhook/* │     │         PM2: postcard-bot (:3000)                │  │
│  └─────────────┘     └──────────────────────────────────────────────────┘  │
│                                        │                                    │
│                          ┌─────────────┴─────────────┐                     │
│                          ▼                           ▼                      │
│                   ┌─────────────┐             ┌─────────────┐              │
│                   │ PostgreSQL  │             │    Redis    │              │
│                   │    :5432    │             │    :6379    │              │
│                   └─────────────┘             └─────────────┘              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Структура файлов CI/CD

```
.github/
└── workflows/
    ├── ci.yml          # Continuous Integration (тесты, линтинг, сборка)
    └── deploy.yml      # Continuous Deployment (деплой на VPS)

deploy/
├── setup-server.sh     # Первоначальная настройка сервера
├── ssl-setup.sh        # Настройка SSL сертификатов
├── docker-compose.yml  # Docker для PostgreSQL/Redis (опционально)
└── nginx/
    └── postcard-bot.conf  # Конфигурация Nginx
```

## Этапы внедрения

### Этап 1: Подготовка VPS сервера

#### 1.1 Подключение к серверу

```bash
ssh root@your-server-ip
```

#### 1.2 Запуск скрипта настройки

```bash
# Скачиваем и запускаем скрипт
curl -O https://raw.githubusercontent.com/dmsk01/tg-bot/main/deploy/setup-server.sh
chmod +x setup-server.sh

# ВАЖНО: Отредактируйте переменные в начале скрипта!
nano setup-server.sh
```

В начале файла измените:
```bash
DOMAIN="poct-card.ru"              # Ваш домен
APP_USER="root"                     # Или создайте пользователя deploy
DB_PASSWORD="сложный_пароль"        # Пароль для PostgreSQL
```

```bash
# Запускаем
./setup-server.sh
```

Скрипт установит:
- Node.js 20 LTS
- PM2
- PostgreSQL 16
- Redis
- Nginx
- Certbot (Let's Encrypt)
- Настроит файервол (UFW)

> **Примечание:** Если скрипт прервался, см. раздел "Ручная настройка" ниже.

#### 1.3 Генерация SSH ключа для GitHub Actions

На вашем **локальном компьютере**:

```bash
# Генерируем ключ
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy

# Копируем публичный ключ на сервер
ssh-copy-id -i ~/.ssh/github_actions_deploy.pub deploy@your-server-ip

# Проверяем подключение
ssh -i ~/.ssh/github_actions_deploy deploy@your-server-ip
```

### Этап 2: Настройка домена и SSL

#### 2.1 Настройка DNS

В панели управления доменом добавьте A-записи:
- `@` → IP вашего сервера
- `www` → IP вашего сервера

#### 2.2 Получение SSL сертификата

```bash
# Простой способ (рекомендуется)
certbot --nginx -d poct-card.ru --non-interactive --agree-tos --email your@email.com

# Или через скрипт
cd /tmp
curl -O https://raw.githubusercontent.com/dmsk01/tg-bot/main/deploy/ssl-setup.sh
chmod +x ssl-setup.sh
./ssl-setup.sh poct-card.ru your@email.com
```

### Этап 3: Настройка GitHub Secrets

В репозитории GitHub: **Settings → Secrets and variables → Actions**

#### Обязательные Secrets:

| Название | Описание | Пример |
|----------|----------|--------|
| `VPS_HOST` | IP адрес или домен сервера | `123.45.67.89` |
| `VPS_USER` | Пользователь для SSH | `deploy` |
| `VPS_SSH_KEY` | Приватный SSH ключ | Содержимое `~/.ssh/github_actions_deploy` |
| `APP_URL` | URL приложения | `https://your-domain.com` |
| `VITE_API_URL` | URL API для фронтенда | `https://your-domain.com` |
| `VITE_TELEGRAM_BOT_USERNAME` | Username бота | `@your_bot` |

#### Как добавить SSH ключ:

```bash
# Копируем приватный ключ
cat ~/.ssh/github_actions_deploy
```

Вставьте содержимое в GitHub Secret `VPS_SSH_KEY`.

### Этап 4: Настройка переменных окружения на сервере

```bash
# На сервере
sudo nano /var/www/postcard-bot/backend/.env
```

Заполните все значения:

```env
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://postcard_bot:YOUR_PASSWORD@localhost:5432/postcard_bot

# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
TELEGRAM_WEBHOOK_URL=https://your-domain.com/webhook/telegram
MINI_APP_URL=https://your-domain.com

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=generate_strong_random_string_here

# ... остальные переменные
```

### Этап 5: Первый деплой

#### 5.1 Запуск через GitHub Actions

1. Сделайте push в ветку `main`
2. Или запустите вручную: **Actions → Deploy to VPS → Run workflow**

#### 5.2 Мониторинг деплоя

```bash
# На сервере - смотрим логи PM2
pm2 logs postcard-bot

# Статус процессов
pm2 status

# Мониторинг в реальном времени
pm2 monit
```

### Этап 6: Настройка Telegram Webhook

После успешного деплоя:

```bash
# Устанавливаем webhook
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://your-domain.com/webhook/telegram"}'

# Проверяем статус
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

## CI Pipeline (ci.yml)

### Что делает:

1. **Backend CI:**
   - Установка зависимостей
   - Генерация Prisma Client
   - ESLint проверка
   - TypeScript type check
   - Сборка проекта

2. **Frontend CI:**
   - Установка зависимостей
   - ESLint проверка
   - TypeScript type check
   - Сборка Vite

3. **Security Audit:**
   - npm audit для обоих проектов

### Триггеры:
- Push в `main`, `develop`, `feature/*`
- Pull Request в `main`, `develop`

## CD Pipeline (deploy.yml)

### Что делает:

1. **Build:**
   - Сборка backend и frontend
   - Создание deploy package (tar.gz)

2. **Deploy:**
   - Копирование на сервер через SCP
   - Backup текущей версии
   - Распаковка новой версии
   - Установка production зависимостей
   - Prisma migrate deploy
   - PM2 reload
   - Nginx reload
   - Health check

### Триггеры:
- Push в `main`
- Ручной запуск (workflow_dispatch)

### Zero-Downtime Deployment

Деплой использует `pm2 reload` для graceful перезапуска без downtime.

## Команды для управления

### PM2

```bash
# Статус
pm2 status

# Логи
pm2 logs postcard-bot
pm2 logs postcard-bot --lines 100

# Перезапуск
pm2 reload postcard-bot

# Остановка
pm2 stop postcard-bot

# Мониторинг
pm2 monit
```

### Nginx

```bash
# Проверка конфига
sudo nginx -t

# Перезагрузка
sudo systemctl reload nginx

# Логи
tail -f /var/log/nginx/postcard-bot-access.log
tail -f /var/log/nginx/postcard-bot-error.log
```

### PostgreSQL

```bash
# Подключение
sudo -u postgres psql -d postcard_bot

# Backup
pg_dump -U postcard_bot postcard_bot > backup.sql

# Restore
psql -U postcard_bot postcard_bot < backup.sql
```

### Prisma

```bash
cd /var/www/postcard-bot/backend

# Статус миграций
npx prisma migrate status

# Применить миграции
npx prisma migrate deploy

# Prisma Studio (для отладки)
npx prisma studio
```

## Rollback

### Автоматический (через GitHub Actions)

При ручном запуске workflow с ошибкой автоматически запускается rollback job.

### Ручной

```bash
# На сервере
cd /var/www/backups

# Смотрим доступные бекапы
ls -la backup_*.tar.gz

# Восстанавливаем
cd /var/www/postcard-bot
tar -xzvf /var/www/backups/backup_20240118_120000.tar.gz

# Перезапускаем
cd backend
pm2 reload ecosystem.config.js --env production
```

## Мониторинг и алерты

### Проверка здоровья

```bash
# Health check endpoint
curl https://your-domain.com/api/health

# SSL проверка
curl -vI https://your-domain.com
```

### Ротация логов PM2

```bash
# Установка модуля
pm2 install pm2-logrotate

# Настройка
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

## Безопасность

### Чек-лист

- [ ] SSH ключ только для деплоя (без пароля на сервере)
- [ ] UFW firewall активен (только 22, 80, 443)
- [ ] PostgreSQL слушает только localhost
- [ ] Redis слушает только localhost
- [ ] .env файлы не в git
- [ ] Secrets только в GitHub Secrets
- [ ] SSL сертификат установлен
- [ ] HSTS заголовок включен

### Обновление зависимостей

```bash
# Проверка уязвимостей
npm audit

# Автоматическое исправление
npm audit fix
```

## Ручная настройка (если скрипт прервался)

Если `setup-server.sh` прервался, выполните оставшиеся шаги вручную:

### 1. Создание директорий

```bash
mkdir -p /var/www/postcard-bot/{backend,frontend,logs,uploads,generated}
mkdir -p /var/www/backups
```

### 2. Установка Nginx и Certbot

```bash
apt install -y nginx certbot python3-certbot-nginx
systemctl enable nginx
systemctl start nginx
```

### 3. Получение SSL сертификата

```bash
certbot --nginx -d poct-card.ru --non-interactive --agree-tos --email your@email.com
```

### 4. Настройка Nginx

```bash
nano /etc/nginx/sites-available/postcard-bot
```

Содержимое:
```nginx
upstream backend {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name poct-card.ru;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name poct-card.ru;

    ssl_certificate /etc/letsencrypt/live/poct-card.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/poct-card.ru/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    root /var/www/postcard-bot/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /webhook {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Активируйте:
```bash
ln -sf /etc/nginx/sites-available/postcard-bot /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

### 5. Создание .env файла

```bash
nano /var/www/postcard-bot/backend/.env
```

## Известные проблемы

### Redis service name на Ubuntu 24

На Ubuntu 24 служба Redis называется `redis-server`, а не `redis`. Скрипт автоматически обрабатывает оба варианта.

### ESLint import/no-unresolved на CI

На Linux CI файловая система case-sensitive. Правило `import/no-unresolved` отключено, так как TypeScript уже проверяет импорты.

## Troubleshooting

### Деплой не проходит

1. Проверьте SSH подключение:
   ```bash
   ssh -i ~/.ssh/github_actions_deploy deploy@your-server-ip
   ```

2. Проверьте права на директории:
   ```bash
   ls -la /var/www/postcard-bot/
   ```

3. Проверьте логи GitHub Actions

### Приложение не запускается

1. Проверьте .env файл:
   ```bash
   cat /var/www/postcard-bot/backend/.env
   ```

2. Проверьте логи PM2:
   ```bash
   pm2 logs postcard-bot --lines 100
   ```

3. Проверьте подключение к БД:
   ```bash
   cd /var/www/postcard-bot/backend
   npx prisma db pull
   ```

### SSL не работает

1. Проверьте сертификат:
   ```bash
   sudo certbot certificates
   ```

2. Обновите сертификат:
   ```bash
   sudo certbot renew --force-renewal
   ```

## Полезные ссылки

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)
- [Let's Encrypt](https://letsencrypt.org/docs/)
- [Nginx Configuration](https://nginx.org/en/docs/)
