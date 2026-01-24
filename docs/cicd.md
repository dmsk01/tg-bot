# CI/CD (Docker)

## Обзор

Continuous Integration и Continuous Deployment с использованием GitHub Actions и Docker.

## Архитектура

```
┌─────────────────────────────────────────────────────────────────┐
│                        VPS Ubuntu 24                             │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                      Docker                              │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │    │
│  │  │  PostgreSQL │  │    Redis    │  │     Backend     │  │    │
│  │  │     :5432   │  │    :6379    │  │      :3000      │  │    │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘  │    │
│  │                                            ▲             │    │
│  │  ┌─────────────────────────────────────────┴──────────┐ │    │
│  │  │              Nginx (:80, :443)                      │ │    │
│  │  │         SSL из /etc/letsencrypt хоста              │ │    │
│  │  └─────────────────────────────────────────────────────┘ │    │
│  └─────────────────────────────────────────────────────────┘    │
│                    Certbot (нативный)                           │
└─────────────────────────────────────────────────────────────────┘
```

## Структура файлов

```
.github/
└── workflows/
    ├── ci.yml          # Тесты, линтинг, сборка
    └── deploy.yml      # Деплой на VPS

deploy/
├── docker-compose.yml  # Полный стек (PG, Redis, Backend, Nginx)
├── nginx.conf          # Конфиг Nginx для контейнера
├── setup-server.sh     # Первоначальная настройка сервера
├── migrate-to-docker.sh # Миграция с нативных сервисов
└── ssl-setup.sh        # Настройка SSL

backend/
├── Dockerfile          # Multi-stage build для Node.js
└── .dockerignore
```

## Настройка нового сервера

### 1. Запуск скрипта настройки

```bash
ssh root@your-server-ip

curl -O https://raw.githubusercontent.com/dmsk01/tg-bot/main/deploy/setup-server.sh
chmod +x setup-server.sh
./setup-server.sh
```

### 2. Генерация SSH ключа для GitHub Actions

На локальном компьютере:

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy
ssh-copy-id -i ~/.ssh/github_actions_deploy.pub deploy@your-server-ip
```

### 3. Получение SSL сертификата

```bash
certbot certonly --standalone -d your-domain.com -d www.your-domain.com
```

### 4. Создание конфигурации

```bash
cd /var/www/postcard-bot/deploy

# .env для docker-compose
cat > .env << 'EOF'
POSTGRES_USER=postcard_bot
POSTGRES_PASSWORD=YOUR_STRONG_PASSWORD
POSTGRES_DB=postcard_bot
EOF

# backend.env
cat > backend.env << 'EOF'
NODE_ENV=production
PORT=3000
TELEGRAM_BOT_TOKEN=your_token
TELEGRAM_WEBHOOK_URL=https://your-domain.com/webhook/telegram
MINI_APP_URL=https://your-domain.com
JWT_SECRET=your_secret
# ... остальные переменные
EOF
```

### 5. Настройка GitHub Secrets

В репозитории: **Settings → Secrets and variables → Actions**

| Secret | Описание | Пример |
|--------|----------|--------|
| `VPS_HOST` | IP или домен сервера | `123.45.67.89` |
| `VPS_USER` | SSH пользователь | `deploy` или `root` |
| `VPS_SSH_KEY` | Приватный SSH ключ | Содержимое `~/.ssh/github_actions_deploy` |
| `APP_URL` | URL приложения | `https://your-domain.com` |
| `VITE_API_URL` | URL API | `https://your-domain.com` |
| `VITE_TELEGRAM_BOT_USERNAME` | Username бота | `@your_bot` |

## CI Pipeline (ci.yml)

### Триггеры
- Push в `main`, `develop`, `feature/*`
- Pull Request в `main`, `develop`

### Что делает

1. **Backend CI:**
   - Установка зависимостей
   - Генерация Prisma Client
   - ESLint проверка
   - TypeScript type check
   - Сборка

2. **Frontend CI:**
   - Установка зависимостей
   - ESLint проверка
   - TypeScript type check
   - Сборка Vite

## CD Pipeline (deploy.yml)

### Триггеры
- Push в `main`
- Ручной запуск (workflow_dispatch)

### Что делает

1. **Build Frontend:**
   - Сборка React приложения
   - Upload артефакта

2. **Deploy:**
   - Копирование файлов на сервер (SCP)
   - Обновление backend и frontend
   - `docker compose build backend`
   - `docker compose up -d`
   - Prisma migrate deploy
   - Health check

### Процесс деплоя

```
GitHub Push → GitHub Actions → SCP на сервер → docker compose build → docker compose up
```

## Команды управления

### Docker Compose

```bash
cd /var/www/postcard-bot/deploy

# Статус
docker compose ps

# Логи
docker compose logs -f backend
docker compose logs -f --tail 100

# Перезапуск
docker compose restart backend
docker compose restart nginx

# Остановка
docker compose down

# Полная пересборка
docker compose build --no-cache backend
docker compose up -d
```

### PostgreSQL

```bash
# Подключение
docker exec -it postcard-postgres psql -U postcard_bot -d postcard_bot

# Backup
docker exec postcard-postgres pg_dump -U postcard_bot postcard_bot > backup.sql

# Restore
cat backup.sql | docker exec -i postcard-postgres psql -U postcard_bot -d postcard_bot
```

### Prisma

```bash
# Статус миграций
docker exec postcard-backend npx prisma migrate status

# Применить миграции
docker exec postcard-backend npx prisma migrate deploy
```

### Nginx

```bash
# Проверка конфига
docker exec postcard-nginx nginx -t

# Перезагрузка
docker exec postcard-nginx nginx -s reload

# Логи
docker compose logs nginx
```

## SSL сертификаты

### Автообновление

Certbot использует standalone режим. Конфиг `/etc/letsencrypt/renewal/*.conf` содержит hooks:

```ini
[renewalparams]
authenticator = standalone
pre_hook = docker stop postcard-nginx
post_hook = docker start postcard-nginx
```

При обновлении Certbot автоматически останавливает Nginx, получает сертификат и запускает Nginx обратно.

### Ручное обновление

```bash
# Проверка
certbot certificates

# Тест обновления
certbot renew --dry-run

# Принудительное обновление
certbot renew --force-renewal
```

## Rollback

### Через бэкапы

```bash
cd /var/www/postcard-bot

# Список бэкапов
ls -la /var/www/backups/

# Восстановление
tar -xzvf /var/www/backups/backup_TIMESTAMP.tar.gz

# Пересборка
cd deploy
docker compose build backend
docker compose up -d
```

### Откат git

```bash
# На сервере
cd /var/www/postcard-bot
git log --oneline -5
git checkout <previous-commit>

cd deploy
docker compose build backend
docker compose up -d
```

## Мониторинг

```bash
# Ресурсы контейнеров
docker stats

# Место на диске
docker system df
df -h /

# Health check
curl https://your-domain.com/api/health

# Логи в реальном времени
docker compose logs -f
```

## Очистка

```bash
# Build cache (освобождает много места)
docker builder prune -f

# Неиспользуемые образы
docker image prune -f

# Всё неиспользуемое
docker system prune -f
```

## Troubleshooting

### Деплой падает

1. Проверьте SSH подключение:
   ```bash
   ssh -i ~/.ssh/github_actions_deploy deploy@your-server-ip
   ```

2. Проверьте наличие .env файлов:
   ```bash
   ls -la /var/www/postcard-bot/deploy/.env
   ls -la /var/www/postcard-bot/deploy/backend.env
   ```

3. Проверьте логи GitHub Actions

### Docker Hub rate limit

```bash
# Залогиниться
docker login -u your_username

# Пересобрать
docker compose build backend
docker compose up -d
```

### Контейнер не стартует

```bash
# Логи
docker compose logs backend

# Статус
docker compose ps

# Конфигурация
docker compose config
```

## Безопасность

### Чек-лист

- [ ] SSH ключ только для деплоя
- [ ] UFW firewall (22, 80, 443)
- [ ] .env файлы не в git
- [ ] Secrets в GitHub Secrets
- [ ] SSL сертификат установлен
- [ ] Docker логин (для rate limit)

## Миграция с нативных сервисов

Если на сервере уже установлены нативные PostgreSQL/Redis/Nginx:

```bash
curl -O https://raw.githubusercontent.com/dmsk01/tg-bot/main/deploy/migrate-to-docker.sh
chmod +x migrate-to-docker.sh
sudo ./migrate-to-docker.sh
```

Скрипт:
1. Создаст бэкап PostgreSQL
2. Создаст конфигурацию из существующих .env
3. Остановит нативные сервисы
4. Запустит Docker контейнеры
5. Импортирует данные
