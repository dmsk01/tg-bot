#!/bin/bash

# =============================================================================
# Скрипт первоначальной настройки VPS сервера Ubuntu 24
# =============================================================================
# Устанавливает Docker и Certbot, настраивает сервер для деплоя
#
# Использование:
#   chmod +x setup-server.sh
#   sudo ./setup-server.sh
#
# ВАЖНО: Запускать от root или с sudo
# =============================================================================

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Проверка root прав
if [ "$EUID" -ne 0 ]; then
    log_error "Пожалуйста, запустите скрипт с sudo"
    exit 1
fi

# =============================================================================
# ПЕРЕМЕННЫЕ КОНФИГУРАЦИИ
# =============================================================================
DOMAIN="poct-card.ru"
APP_USER="deploy"
APP_DIR="/var/www/postcard-bot"

echo ""
echo "=========================================="
echo " Настройка VPS для Postcard Bot (Docker)"
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

ufw default deny incoming
ufw default allow outgoing

# SSH
ufw allow 22/tcp

# HTTP и HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

echo "y" | ufw enable

log_info "Файервол настроен"

# =============================================================================
# 4. Установка Docker
# =============================================================================
log_info "Установка Docker..."

# Удаляем старые версии если есть
apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true

# Добавляем официальный GPG ключ Docker
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

# Добавляем репозиторий
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

# Устанавливаем Docker
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Включаем автозапуск
systemctl enable docker
systemctl start docker

# Проверяем версию
docker_version=$(docker --version)
log_info "Docker установлен: $docker_version"

# =============================================================================
# 5. Установка Certbot для SSL
# =============================================================================
log_info "Установка Certbot..."
apt install -y certbot

log_info "Certbot установлен"

# =============================================================================
# 6. Создание пользователя для деплоя
# =============================================================================
log_info "Создание пользователя для деплоя..."

if id "$APP_USER" &>/dev/null; then
    log_warn "Пользователь $APP_USER уже существует"
else
    adduser --disabled-password --gecos "" $APP_USER
    log_info "Пользователь $APP_USER создан"
fi

# Добавляем в группу docker
usermod -aG docker $APP_USER

# Настраиваем sudo для docker compose без пароля
echo "$APP_USER ALL=(ALL) NOPASSWD: /usr/bin/docker, /usr/bin/docker-compose, /usr/bin/docker compose" > /etc/sudoers.d/$APP_USER
chmod 440 /etc/sudoers.d/$APP_USER

log_info "Пользователь $APP_USER добавлен в группу docker"

# =============================================================================
# 7. Создание структуры директорий
# =============================================================================
log_info "Создание структуры директорий..."

mkdir -p $APP_DIR/deploy
mkdir -p $APP_DIR/frontend/dist
mkdir -p $APP_DIR/backend
mkdir -p /var/www/backups

# Устанавливаем владельца
chown -R $APP_USER:$APP_USER $APP_DIR
chown -R $APP_USER:$APP_USER /var/www/backups

chmod -R 755 $APP_DIR

log_info "Директории созданы"

# =============================================================================
# 8. Настройка SSH ключа для GitHub Actions
# =============================================================================
log_info "Настройка SSH для деплоя..."

mkdir -p /home/$APP_USER/.ssh
chmod 700 /home/$APP_USER/.ssh
touch /home/$APP_USER/.ssh/authorized_keys
chmod 600 /home/$APP_USER/.ssh/authorized_keys
chown -R $APP_USER:$APP_USER /home/$APP_USER/.ssh

log_warn "ВАЖНО: Добавьте публичный SSH ключ в /home/$APP_USER/.ssh/authorized_keys"

# =============================================================================
# 9. Настройка автообновления SSL сертификатов
# =============================================================================
log_info "Настройка автообновления SSL..."

mkdir -p /etc/letsencrypt/renewal-hooks/deploy

cat > /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh << 'EOF'
#!/bin/bash
# Перезагрузка Nginx в Docker после обновления сертификата
docker exec postcard-nginx nginx -s reload 2>/dev/null || true
EOF

chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh

log_info "Hook для автообновления SSL создан"

# =============================================================================
# 10. Создание шаблонов конфигурации
# =============================================================================
log_info "Создание шаблонов конфигурации..."

# .env для docker-compose
cat > $APP_DIR/deploy/.env.example << 'EOF'
# PostgreSQL
POSTGRES_USER=postcard_bot
POSTGRES_PASSWORD=CHANGE_ME_STRONG_PASSWORD
POSTGRES_DB=postcard_bot
EOF

# backend.env
cat > $APP_DIR/deploy/backend.env.example << 'EOF'
# Environment
NODE_ENV=production
PORT=3000

# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_WEBHOOK_URL=https://poct-card.ru/webhook/telegram
MINI_APP_URL=https://poct-card.ru

# Kandinsky API
KANDINSKY_API_KEY=
KANDINSKY_SECRET_KEY=
KANDINSKY_API_URL=https://api-key.fusionbrain.ai/

# YooKassa
YOOKASSA_SHOP_ID=
YOOKASSA_SECRET_KEY=
YOOKASSA_RETURN_URL=https://poct-card.ru/payment/success

# Storage (внутри контейнера)
UPLOAD_DIR=/app/uploads
GENERATED_DIR=/app/generated
MAX_FILE_SIZE=10485760

# Costs
GENERATION_COST=10.00

# JWT
JWT_SECRET=GENERATE_RANDOM_STRING_HERE

# Logging
LOG_LEVEL=info
EOF

chown $APP_USER:$APP_USER $APP_DIR/deploy/.env.example
chown $APP_USER:$APP_USER $APP_DIR/deploy/backend.env.example

log_warn "ВАЖНО: Скопируйте и заполните файлы конфигурации:"
echo "  cp $APP_DIR/deploy/.env.example $APP_DIR/deploy/.env"
echo "  cp $APP_DIR/deploy/backend.env.example $APP_DIR/deploy/backend.env"

# =============================================================================
# 11. Финальные проверки
# =============================================================================
echo ""
echo "=========================================="
echo " Установка завершена!"
echo "=========================================="
echo ""

log_info "Версии установленного ПО:"
echo "  Docker: $(docker --version)"
echo "  Docker Compose: $(docker compose version)"
echo "  Certbot: $(certbot --version 2>&1 | head -1)"
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
echo "2. Получите SSL сертификат (временно запустите standalone):"
echo "   sudo certbot certonly --standalone -d $DOMAIN -d www.$DOMAIN"
echo ""
echo "3. Создайте файлы конфигурации:"
echo "   cp $APP_DIR/deploy/.env.example $APP_DIR/deploy/.env"
echo "   cp $APP_DIR/deploy/backend.env.example $APP_DIR/deploy/backend.env"
echo "   nano $APP_DIR/deploy/.env"
echo "   nano $APP_DIR/deploy/backend.env"
echo ""
echo "4. Настройте GitHub Secrets:"
echo "   - VPS_HOST: IP адрес сервера"
echo "   - VPS_USER: $APP_USER"
echo "   - VPS_SSH_KEY: приватный SSH ключ"
echo ""
echo "5. Запустите первый деплой через GitHub Actions"
echo "   или вручную: cd $APP_DIR/deploy && docker compose up -d"
echo ""
echo "=========================================="
