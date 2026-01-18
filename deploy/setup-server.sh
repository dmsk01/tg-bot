#!/bin/bash

# =============================================================================
# Скрипт первоначальной настройки VPS сервера Ubuntu 24
# =============================================================================
# Этот скрипт выполняется ОДИН РАЗ при первом деплое
# Устанавливает все необходимые зависимости и настраивает сервер
#
# Использование:
#   chmod +x setup-server.sh
#   sudo ./setup-server.sh
#
# ВАЖНО: Запускать от root или с sudo
# =============================================================================

set -e  # Остановить при ошибке

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Функции для логирования
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Проверка root прав
if [ "$EUID" -ne 0 ]; then
    log_error "Пожалуйста, запустите скрипт с sudo"
    exit 1
fi

# =============================================================================
# ПЕРЕМЕННЫЕ КОНФИГУРАЦИИ
# =============================================================================
# !!! ИЗМЕНИТЕ ЭТИ ЗНАЧЕНИЯ ПЕРЕД ЗАПУСКОМ !!!

DOMAIN="your-domain.com"              # Ваш домен
APP_USER="deploy"                      # Пользователь для деплоя
APP_DIR="/var/www/postcard-bot"       # Директория приложения
DB_NAME="postcard_bot"                 # Имя базы данных
DB_USER="postcard_bot"                 # Пользователь БД
DB_PASSWORD="CHANGE_ME_STRONG_PASSWORD" # Пароль БД (ОБЯЗАТЕЛЬНО ИЗМЕНИТЕ!)

# =============================================================================
echo ""
echo "=========================================="
echo " Настройка VPS для Postcard Bot"
echo "=========================================="
echo ""

# =============================================================================
# 1. Обновление системы
# =============================================================================
log_info "Обновление системы..."
apt update && apt upgrade -y

# =============================================================================
# 2. Установка базовых пакетов
# =============================================================================
log_info "Установка базовых пакетов..."
apt install -y \
    curl \
    wget \
    git \
    htop \
    ufw \
    fail2ban \
    unzip \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release

# =============================================================================
# 3. Настройка файервола (UFW)
# =============================================================================
log_info "Настройка файервола..."

# Базовые правила
ufw default deny incoming
ufw default allow outgoing

# SSH (важно не заблокировать себя!)
ufw allow 22/tcp

# HTTP и HTTPS для веб-сервера
ufw allow 80/tcp
ufw allow 443/tcp

# Включаем файервол
echo "y" | ufw enable

log_info "Файервол настроен"

# =============================================================================
# 4. Установка Node.js 20 LTS
# =============================================================================
log_info "Установка Node.js 20..."

# Добавляем NodeSource репозиторий
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -

# Устанавливаем Node.js
apt install -y nodejs

# Проверяем версию
node_version=$(node --version)
npm_version=$(npm --version)
log_info "Node.js версия: $node_version"
log_info "npm версия: $npm_version"

# =============================================================================
# 5. Установка PM2 глобально
# =============================================================================
log_info "Установка PM2..."
npm install -g pm2

# Настройка автозапуска PM2 при перезагрузке
pm2 startup systemd -u $APP_USER --hp /home/$APP_USER
log_info "PM2 установлен и настроен для автозапуска"

# =============================================================================
# 6. Установка PostgreSQL 16
# =============================================================================
log_info "Установка PostgreSQL 16..."

# Добавляем официальный репозиторий PostgreSQL
sh -c 'echo "deb https://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -

apt update
apt install -y postgresql-16 postgresql-contrib-16

# Запускаем и включаем автозапуск
systemctl start postgresql
systemctl enable postgresql

# Создаем базу данных и пользователя
log_info "Создание базы данных..."
sudo -u postgres psql << EOF
-- Создаем пользователя
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';

-- Создаем базу данных
CREATE DATABASE $DB_NAME OWNER $DB_USER;

-- Даем права
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;

-- Для Prisma нужны права на схему public
\c $DB_NAME
GRANT ALL ON SCHEMA public TO $DB_USER;
EOF

log_info "PostgreSQL установлен и база данных создана"

# =============================================================================
# 7. Установка Redis
# =============================================================================
log_info "Установка Redis..."
apt install -y redis-server

# Настройка Redis для production
sed -i 's/supervised no/supervised systemd/' /etc/redis/redis.conf

# Перезапуск Redis
systemctl restart redis
systemctl enable redis

log_info "Redis установлен"

# =============================================================================
# 8. Установка Nginx
# =============================================================================
log_info "Установка Nginx..."
apt install -y nginx

# Запускаем и включаем автозапуск
systemctl start nginx
systemctl enable nginx

log_info "Nginx установлен"

# =============================================================================
# 9. Установка Certbot для SSL
# =============================================================================
log_info "Установка Certbot..."
apt install -y certbot python3-certbot-nginx

log_info "Certbot установлен"

# =============================================================================
# 10. Создание пользователя для деплоя
# =============================================================================
log_info "Создание пользователя для деплоя..."

# Проверяем, существует ли пользователь
if id "$APP_USER" &>/dev/null; then
    log_warn "Пользователь $APP_USER уже существует"
else
    # Создаем пользователя без пароля (вход только по SSH ключу)
    adduser --disabled-password --gecos "" $APP_USER

    # Добавляем в группу www-data
    usermod -aG www-data $APP_USER

    # Настраиваем sudo для перезапуска nginx и pm2 без пароля
    echo "$APP_USER ALL=(ALL) NOPASSWD: /usr/bin/systemctl reload nginx, /usr/bin/systemctl restart nginx, /usr/bin/nginx" >> /etc/sudoers.d/$APP_USER
    chmod 440 /etc/sudoers.d/$APP_USER

    log_info "Пользователь $APP_USER создан"
fi

# =============================================================================
# 11. Создание структуры директорий
# =============================================================================
log_info "Создание структуры директорий..."

mkdir -p $APP_DIR/backend
mkdir -p $APP_DIR/frontend
mkdir -p $APP_DIR/logs
mkdir -p /var/www/backups

# Устанавливаем владельца
chown -R $APP_USER:www-data $APP_DIR
chown -R $APP_USER:www-data /var/www/backups

# Права доступа
chmod -R 755 $APP_DIR

log_info "Директории созданы"

# =============================================================================
# 12. Настройка SSH ключа для GitHub Actions
# =============================================================================
log_info "Настройка SSH для деплоя..."

# Создаем .ssh директорию для пользователя деплоя
mkdir -p /home/$APP_USER/.ssh
chmod 700 /home/$APP_USER/.ssh
touch /home/$APP_USER/.ssh/authorized_keys
chmod 600 /home/$APP_USER/.ssh/authorized_keys
chown -R $APP_USER:$APP_USER /home/$APP_USER/.ssh

log_warn "ВАЖНО: Добавьте публичный SSH ключ в /home/$APP_USER/.ssh/authorized_keys"
echo ""
echo "Для генерации ключа на вашем компьютере:"
echo "  ssh-keygen -t ed25519 -C \"github-actions-deploy\""
echo ""
echo "Затем добавьте публичный ключ:"
echo "  echo 'ваш_публичный_ключ' >> /home/$APP_USER/.ssh/authorized_keys"
echo ""

# =============================================================================
# 13. Создание базового конфига Nginx
# =============================================================================
log_info "Создание конфигурации Nginx..."

cat > /etc/nginx/sites-available/postcard-bot << 'NGINX_CONFIG'
# =============================================================================
# Nginx конфигурация для Postcard Bot
# =============================================================================
# Этот файл будет обновлен после получения SSL сертификата

# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name YOUR_DOMAIN;  # Замените на ваш домен

    # Для Certbot challenge
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Редирект на HTTPS (после получения сертификата)
    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS server (раскомментируйте после получения SSL)
# server {
#     listen 443 ssl http2;
#     listen [::]:443 ssl http2;
#     server_name YOUR_DOMAIN;
#
#     # SSL сертификаты (Certbot добавит автоматически)
#     ssl_certificate /etc/letsencrypt/live/YOUR_DOMAIN/fullchain.pem;
#     ssl_certificate_key /etc/letsencrypt/live/YOUR_DOMAIN/privkey.pem;
#     include /etc/letsencrypt/options-ssl-nginx.conf;
#     ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
#
#     # Логи
#     access_log /var/log/nginx/postcard-bot-access.log;
#     error_log /var/log/nginx/postcard-bot-error.log;
#
#     # Frontend (статика)
#     location / {
#         root /var/www/postcard-bot/frontend/dist;
#         try_files $uri $uri/ /index.html;
#
#         # Кеширование статики
#         location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
#             expires 30d;
#             add_header Cache-Control "public, immutable";
#         }
#     }
#
#     # Backend API
#     location /api {
#         proxy_pass http://127.0.0.1:3000;
#         proxy_http_version 1.1;
#         proxy_set_header Upgrade $http_upgrade;
#         proxy_set_header Connection 'upgrade';
#         proxy_set_header Host $host;
#         proxy_set_header X-Real-IP $remote_addr;
#         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
#         proxy_set_header X-Forwarded-Proto $scheme;
#         proxy_cache_bypass $http_upgrade;
#         proxy_read_timeout 60s;
#     }
#
#     # Telegram Webhook
#     location /webhook {
#         proxy_pass http://127.0.0.1:3000;
#         proxy_http_version 1.1;
#         proxy_set_header Host $host;
#         proxy_set_header X-Real-IP $remote_addr;
#         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
#         proxy_set_header X-Forwarded-Proto $scheme;
#     }
#
#     # Health check
#     location /health {
#         proxy_pass http://127.0.0.1:3000/api/health;
#     }
#
#     # Security headers
#     add_header X-Frame-Options "SAMEORIGIN" always;
#     add_header X-Content-Type-Options "nosniff" always;
#     add_header X-XSS-Protection "1; mode=block" always;
#     add_header Referrer-Policy "strict-origin-when-cross-origin" always;
# }
NGINX_CONFIG

# Заменяем YOUR_DOMAIN на реальный домен
sed -i "s/YOUR_DOMAIN/$DOMAIN/g" /etc/nginx/sites-available/postcard-bot

# Активируем конфиг
ln -sf /etc/nginx/sites-available/postcard-bot /etc/nginx/sites-enabled/

# Удаляем дефолтный конфиг
rm -f /etc/nginx/sites-enabled/default

# Проверяем и перезапускаем
nginx -t && systemctl reload nginx

log_info "Nginx настроен"

# =============================================================================
# 14. Создание .env файла для backend
# =============================================================================
log_info "Создание шаблона .env файла..."

cat > $APP_DIR/backend/.env << ENV_FILE
# =============================================================================
# Production Environment Variables
# =============================================================================
# ВАЖНО: Заполните все значения перед запуском!

# Environment
NODE_ENV=production
PORT=3000

# Database (PostgreSQL)
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME

# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_WEBHOOK_URL=https://$DOMAIN/webhook/telegram
MINI_APP_URL=https://$DOMAIN

# Redis (для BullMQ очередей)
REDIS_URL=redis://localhost:6379

# Kandinsky API (FusionBrain)
KANDINSKY_API_KEY=
KANDINSKY_SECRET_KEY=
KANDINSKY_API_URL=https://api-key.fusionbrain.ai/

# YooKassa (платежи)
YOOKASSA_SHOP_ID=
YOOKASSA_SECRET_KEY=
YOOKASSA_RETURN_URL=https://$DOMAIN/payment/success

# Storage
UPLOAD_DIR=/var/www/postcard-bot/uploads
GENERATED_DIR=/var/www/postcard-bot/generated
MAX_FILE_SIZE=10485760

# Costs
GENERATION_COST=10.00

# JWT
JWT_SECRET=$(openssl rand -base64 32)

# Logging
LOG_LEVEL=info
ENV_FILE

chown $APP_USER:$APP_USER $APP_DIR/backend/.env
chmod 600 $APP_DIR/backend/.env

log_warn "ВАЖНО: Отредактируйте файл $APP_DIR/backend/.env и заполните все значения!"

# =============================================================================
# 15. Финальные проверки
# =============================================================================
echo ""
echo "=========================================="
echo " Установка завершена!"
echo "=========================================="
echo ""

log_info "Статус сервисов:"
echo ""
systemctl status postgresql --no-pager -l | head -5
echo ""
systemctl status redis --no-pager -l | head -5
echo ""
systemctl status nginx --no-pager -l | head -5
echo ""

# =============================================================================
# СЛЕДУЮЩИЕ ШАГИ
# =============================================================================
echo ""
echo "=========================================="
echo " СЛЕДУЮЩИЕ ШАГИ:"
echo "=========================================="
echo ""
echo "1. Добавьте SSH ключ для GitHub Actions:"
echo "   echo 'публичный_ключ' >> /home/$APP_USER/.ssh/authorized_keys"
echo ""
echo "2. Получите SSL сертификат:"
echo "   sudo certbot --nginx -d $DOMAIN"
echo ""
echo "3. Обновите конфигурацию Nginx:"
echo "   sudo nano /etc/nginx/sites-available/postcard-bot"
echo "   (раскомментируйте HTTPS секцию после получения SSL)"
echo ""
echo "4. Заполните переменные окружения:"
echo "   sudo nano $APP_DIR/backend/.env"
echo ""
echo "5. Настройте GitHub Secrets:"
echo "   - VPS_HOST: IP адрес сервера"
echo "   - VPS_USER: $APP_USER"
echo "   - VPS_SSH_KEY: приватный SSH ключ"
echo "   - APP_URL: https://$DOMAIN"
echo "   - VITE_API_URL: https://$DOMAIN"
echo "   - VITE_TELEGRAM_BOT_USERNAME: @your_bot"
echo ""
echo "6. Запустите первый деплой через GitHub Actions"
echo ""
echo "=========================================="
