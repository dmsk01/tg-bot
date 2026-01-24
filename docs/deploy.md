# Деплой (Docker)

[← Назад к оглавлению](./README.md) | [← ngrok](./ngrok.md)

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
│  │  │                     Nginx                           │ │    │
│  │  │                   :80, :443                         │ │    │
│  │  │        (SSL из /etc/letsencrypt хоста)             │ │    │
│  │  └─────────────────────────────────────────────────────┘ │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                    Certbot (нативный)                           │
└─────────────────────────────────────────────────────────────────┘
```

## Требования к VPS

- **CPU**: 1+ core
- **RAM**: 1+ GB (2 GB рекомендуется)
- **Storage**: 15+ GB SSD
- **OS**: Ubuntu 24.04 LTS
- **Домен**: Направлен на IP сервера

## Быстрый старт (новый сервер)

### 1. Подключение и настройка

```bash
ssh root@your-server-ip

# Скачать и запустить скрипт настройки
curl -O https://raw.githubusercontent.com/dmsk01/tg-bot/main/deploy/setup-server.sh
chmod +x setup-server.sh
./setup-server.sh
```

Скрипт установит:
- Docker и Docker Compose
- Certbot для SSL
- Создаст директории и пользователя deploy

### 2. Получение SSL сертификата

```bash
# Certbot в standalone режиме (порт 80 должен быть свободен)
certbot certonly --standalone -d your-domain.com -d www.your-domain.com
```

### 3. Создание конфигурации

```bash
cd /var/www/postcard-bot/deploy

# .env для docker-compose
cat > .env << 'EOF'
POSTGRES_USER=postcard_bot
POSTGRES_PASSWORD=YOUR_STRONG_PASSWORD
POSTGRES_DB=postcard_bot
EOF

# backend.env для приложения
cat > backend.env << 'EOF'
NODE_ENV=production
PORT=3000

TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_WEBHOOK_URL=https://your-domain.com/webhook/telegram
MINI_APP_URL=https://your-domain.com

KANDINSKY_API_KEY=
KANDINSKY_SECRET_KEY=

YOOKASSA_SHOP_ID=
YOOKASSA_SECRET_KEY=

UPLOAD_DIR=/app/uploads
GENERATED_DIR=/app/generated
MAX_FILE_SIZE=10485760

GENERATION_COST=10.00
JWT_SECRET=your_random_jwt_secret

LOG_LEVEL=info
EOF
```

### 4. Обновление nginx.conf

Отредактируйте `/var/www/postcard-bot/deploy/nginx.conf` — замените `poct-card.ru` на ваш домен.

### 5. Запуск через CI/CD

Настройте GitHub Secrets (см. [CI/CD](./cicd.md)) и сделайте push в main.

Или запустите вручную:

```bash
cd /var/www/postcard-bot/deploy
docker compose build backend
docker compose up -d
```

## Управление контейнерами

```bash
cd /var/www/postcard-bot/deploy

# Статус
docker compose ps

# Логи
docker compose logs -f backend
docker compose logs -f nginx

# Перезапуск
docker compose restart backend

# Полная пересборка
docker compose down
docker compose build --no-cache backend
docker compose up -d
```

## SSL сертификаты

### Автоматическое обновление

Certbot использует standalone режим с автоматической остановкой/запуском Nginx.

Конфиг `/etc/letsencrypt/renewal/poct-card.ru.conf` должен содержать:

```ini
[renewalparams]
authenticator = standalone
pre_hook = cd /var/www/postcard-bot/deploy && docker compose stop nginx
post_hook = cd /var/www/postcard-bot/deploy && docker compose start nginx
```

> **Важно:** Используйте `docker compose stop/start`, а не `docker stop/start`. После `docker stop/start` volumes могут не примонтироваться корректно.

Проверка:
```bash
certbot renew --dry-run
```

### Ручное обновление

```bash
# Проверка срока действия
certbot certificates

# Принудительное обновление (Nginx остановится автоматически)
certbot renew --force-renewal
```

### Получение нового сертификата

```bash
cd /var/www/postcard-bot/deploy

# Остановить Nginx (освободить порт 80)
docker compose stop nginx

# Получить сертификат
certbot certonly --standalone -d your-domain.com

# Запустить Nginx
docker compose start nginx
```

## База данных

### Подключение к PostgreSQL

```bash
docker exec -it postcard-postgres psql -U postcard_bot -d postcard_bot
```

### Backup

```bash
docker exec postcard-postgres pg_dump -U postcard_bot postcard_bot > backup.sql
```

### Restore

```bash
cat backup.sql | docker exec -i postcard-postgres psql -U postcard_bot -d postcard_bot
```

### Миграции Prisma

```bash
docker exec postcard-backend npx prisma migrate deploy
docker exec postcard-backend npx prisma migrate status
```

## Мониторинг

```bash
# Ресурсы Docker
docker stats

# Место на диске
docker system df

# Логи всех сервисов
docker compose logs --tail 100

# Health check
curl https://your-domain.com/api/health
```

## Очистка

```bash
# Удалить build cache
docker builder prune -f

# Удалить неиспользуемые образы
docker image prune -f

# Полная очистка (осторожно!)
docker system prune -a
```

## Rollback

```bash
cd /var/www/postcard-bot/deploy

# Откат к предыдущей версии (если есть backup)
tar -xzvf /var/www/backups/backup_TIMESTAMP.tar.gz -C /var/www/postcard-bot/

# Пересборка и перезапуск
docker compose build backend
docker compose up -d
```

## Troubleshooting

### Контейнер не запускается

```bash
# Проверить логи
docker compose logs backend

# Проверить конфигурацию
docker compose config
```

### Nginx не отвечает

```bash
# Проверить конфиг Nginx
docker exec postcard-nginx nginx -t

# Проверить SSL сертификаты
ls -la /etc/letsencrypt/live/your-domain.com/
```

### База данных недоступна

```bash
# Проверить статус PostgreSQL
docker exec postcard-postgres pg_isready -U postcard_bot

# Проверить логи
docker compose logs postgres
```

### Docker Hub rate limit

```bash
# Залогиниться (увеличивает лимит)
docker login -u your_username

# Потом пересобрать
docker compose build backend
docker compose up -d
```

---

[CI/CD →](./cicd.md)
