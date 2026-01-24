#!/bin/bash

# =============================================================================
# Скрипт миграции с нативных сервисов на Docker
# =============================================================================
# Этот скрипт мигрирует существующую установку:
# - PostgreSQL (нативный) -> Docker
# - Redis (нативный) -> Docker
# - Nginx (нативный) -> Docker
# - PM2 -> Docker
#
# Использование:
#   chmod +x migrate-to-docker.sh
#   sudo ./migrate-to-docker.sh
#
# ВАЖНО:
#   - Сделайте бэкап перед запуском!
#   - Скрипт вызовет даунтайм ~5-10 минут
# =============================================================================

set -e

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Проверка root
if [ "$EUID" -ne 0 ]; then
    log_error "Запустите скрипт с sudo"
    exit 1
fi

APP_DIR="/var/www/postcard-bot"
BACKUP_DIR="/var/www/backups/migration_$(date +%Y%m%d_%H%M%S)"

echo ""
echo "=========================================="
echo " Миграция на Docker"
echo "=========================================="
echo ""

log_warn "Этот скрипт вызовет даунтайм ~5-10 минут"
log_warn "Убедитесь, что у вас есть бэкап!"
echo ""
read -p "Продолжить? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "Отменено"
    exit 0
fi

# =============================================================================
# 1. Создание бэкапа
# =============================================================================
log_info "Шаг 1: Создание бэкапа..."

mkdir -p $BACKUP_DIR

# Бэкап PostgreSQL
if systemctl is-active --quiet postgresql; then
    log_info "Создание дампа PostgreSQL..."
    sudo -u postgres pg_dump postcard_bot > $BACKUP_DIR/postgres_backup.sql
    log_info "PostgreSQL бэкап: $BACKUP_DIR/postgres_backup.sql"
else
    log_warn "PostgreSQL не запущен, пропускаем бэкап"
fi

# Бэкап Redis
if [ -f /var/lib/redis/dump.rdb ]; then
    log_info "Копирование Redis dump..."
    cp /var/lib/redis/dump.rdb $BACKUP_DIR/redis_backup.rdb
    log_info "Redis бэкап: $BACKUP_DIR/redis_backup.rdb"
fi

# Бэкап .env файлов
if [ -f $APP_DIR/backend/.env ]; then
    cp $APP_DIR/backend/.env $BACKUP_DIR/backend.env.bak
fi

# Бэкап uploads и generated
if [ -d $APP_DIR/uploads ] && [ "$(ls -A $APP_DIR/uploads 2>/dev/null)" ]; then
    log_info "Копирование uploads..."
    cp -r $APP_DIR/uploads $BACKUP_DIR/
fi

if [ -d $APP_DIR/generated ] && [ "$(ls -A $APP_DIR/generated 2>/dev/null)" ]; then
    log_info "Копирование generated..."
    cp -r $APP_DIR/generated $BACKUP_DIR/
fi

log_info "Бэкап создан в: $BACKUP_DIR"

# =============================================================================
# 2. Остановка приложения
# =============================================================================
log_info "Шаг 2: Остановка приложения..."

# Останавливаем PM2
if command -v pm2 &> /dev/null; then
    pm2 stop all 2>/dev/null || true
    pm2 delete all 2>/dev/null || true
fi

# =============================================================================
# 3. Проверка Docker
# =============================================================================
log_info "Шаг 3: Проверка Docker..."

if ! command -v docker &> /dev/null; then
    log_error "Docker не установлен! Запустите сначала setup-server.sh"
    exit 1
fi

docker_version=$(docker --version)
log_info "Docker: $docker_version"

# =============================================================================
# 4. Создание конфигурации Docker
# =============================================================================
log_info "Шаг 4: Настройка конфигурации Docker..."

# Получаем пароль PostgreSQL из существующего .env
if [ -f $APP_DIR/backend/.env ]; then
    EXISTING_DB_URL=$(grep "^DATABASE_URL=" $APP_DIR/backend/.env | cut -d'=' -f2-)
    # Извлекаем пароль из DATABASE_URL
    PG_PASSWORD=$(echo $EXISTING_DB_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
fi

if [ -z "$PG_PASSWORD" ]; then
    log_warn "Не удалось извлечь пароль PostgreSQL"
    read -p "Введите пароль PostgreSQL: " PG_PASSWORD
fi

# Создаем .env для docker-compose
cat > $APP_DIR/deploy/.env << EOF
POSTGRES_USER=postcard_bot
POSTGRES_PASSWORD=$PG_PASSWORD
POSTGRES_DB=postcard_bot
EOF

chmod 600 $APP_DIR/deploy/.env
log_info "Создан $APP_DIR/deploy/.env"

# Создаем backend.env из существующего .env
if [ -f $APP_DIR/backend/.env ]; then
    # Копируем и модифицируем для Docker
    cp $APP_DIR/backend/.env $APP_DIR/deploy/backend.env

    # Обновляем пути для контейнера
    sed -i 's|UPLOAD_DIR=.*|UPLOAD_DIR=/app/uploads|' $APP_DIR/deploy/backend.env
    sed -i 's|GENERATED_DIR=.*|GENERATED_DIR=/app/generated|' $APP_DIR/deploy/backend.env

    # Удаляем DATABASE_URL и REDIS_URL (будут заданы в docker-compose)
    sed -i '/^DATABASE_URL=/d' $APP_DIR/deploy/backend.env
    sed -i '/^REDIS_URL=/d' $APP_DIR/deploy/backend.env

    chmod 600 $APP_DIR/deploy/backend.env
    log_info "Создан $APP_DIR/deploy/backend.env"
fi

# =============================================================================
# 5. Остановка нативных сервисов
# =============================================================================
log_info "Шаг 5: Остановка нативных сервисов..."

# Останавливаем Nginx
if systemctl is-active --quiet nginx; then
    systemctl stop nginx
    systemctl disable nginx
    log_info "Nginx остановлен и отключен"
fi

# Останавливаем Redis
if systemctl is-active --quiet redis-server; then
    systemctl stop redis-server
    systemctl disable redis-server
    log_info "Redis остановлен и отключен"
fi

# Останавливаем PostgreSQL
if systemctl is-active --quiet postgresql; then
    systemctl stop postgresql
    systemctl disable postgresql
    log_info "PostgreSQL остановлен и отключен"
fi

# =============================================================================
# 6. Запуск Docker контейнеров
# =============================================================================
log_info "Шаг 6: Запуск Docker контейнеров..."

cd $APP_DIR/deploy

# Сначала запускаем только БД
docker compose up -d postgres redis

# Ждем готовности PostgreSQL
log_info "Ожидание готовности PostgreSQL..."
for i in {1..30}; do
    if docker exec postcard-postgres pg_isready -U postcard_bot > /dev/null 2>&1; then
        log_info "PostgreSQL готов!"
        break
    fi
    echo -n "."
    sleep 2
done
echo ""

# =============================================================================
# 7. Импорт данных PostgreSQL
# =============================================================================
log_info "Шаг 7: Импорт данных PostgreSQL..."

if [ -f $BACKUP_DIR/postgres_backup.sql ]; then
    cat $BACKUP_DIR/postgres_backup.sql | docker exec -i postcard-postgres psql -U postcard_bot -d postcard_bot
    log_info "Данные PostgreSQL импортированы"
else
    log_warn "Файл бэкапа PostgreSQL не найден, пропускаем импорт"
fi

# =============================================================================
# 8. Копирование uploads/generated в Docker volumes
# =============================================================================
log_info "Шаг 8: Копирование файлов в Docker volumes..."

# Создаем временный контейнер для копирования
if [ -d $BACKUP_DIR/uploads ] && [ "$(ls -A $BACKUP_DIR/uploads 2>/dev/null)" ]; then
    # Запускаем backend чтобы создались volumes
    docker compose up -d backend
    sleep 5

    # Копируем файлы
    for file in $BACKUP_DIR/uploads/*; do
        if [ -f "$file" ]; then
            docker cp "$file" postcard-backend:/app/uploads/
        fi
    done
    log_info "Uploads скопированы"
fi

if [ -d $BACKUP_DIR/generated ] && [ "$(ls -A $BACKUP_DIR/generated 2>/dev/null)" ]; then
    for file in $BACKUP_DIR/generated/*; do
        if [ -f "$file" ]; then
            docker cp "$file" postcard-backend:/app/generated/
        fi
    done
    log_info "Generated скопированы"
fi

# =============================================================================
# 9. Запуск всех сервисов
# =============================================================================
log_info "Шаг 9: Запуск всех сервисов..."

docker compose up -d

# Ждем запуска
sleep 10

# =============================================================================
# 10. Применение миграций Prisma
# =============================================================================
log_info "Шаг 10: Применение миграций базы данных..."

docker exec postcard-backend npx prisma migrate deploy || log_warn "Миграции не применены (возможно, уже применены)"

# =============================================================================
# 11. Проверка
# =============================================================================
log_info "Шаг 11: Проверка..."

echo ""
echo "Статус контейнеров:"
docker compose ps

echo ""
echo "Проверка health endpoints:"

# Проверяем backend
BACKEND_HEALTH=$(docker exec postcard-backend curl -s http://localhost:3000/api/health 2>/dev/null || echo "failed")
if [[ "$BACKEND_HEALTH" == *"ok"* ]] || [[ "$BACKEND_HEALTH" == *"healthy"* ]]; then
    log_info "Backend: OK"
else
    log_warn "Backend health check: $BACKEND_HEALTH"
fi

# Проверяем nginx
NGINX_STATUS=$(docker exec postcard-nginx nginx -t 2>&1)
if [[ "$NGINX_STATUS" == *"successful"* ]]; then
    log_info "Nginx config: OK"
else
    log_warn "Nginx: $NGINX_STATUS"
fi

# =============================================================================
# 12. Настройка автообновления SSL
# =============================================================================
log_info "Шаг 12: Настройка автообновления SSL..."

mkdir -p /etc/letsencrypt/renewal-hooks/deploy

cat > /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh << 'EOF'
#!/bin/bash
docker exec postcard-nginx nginx -s reload
EOF

chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
log_info "SSL renewal hook настроен"

# =============================================================================
# Завершение
# =============================================================================
echo ""
echo "=========================================="
echo " Миграция завершена!"
echo "=========================================="
echo ""
log_info "Контейнеры запущены:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
log_info "Бэкап сохранен в: $BACKUP_DIR"
echo ""
log_warn "Проверьте работу приложения:"
echo "  - https://poct-card.ru"
echo "  - https://poct-card.ru/api/health"
echo "  - Telegram бот"
echo ""
log_warn "Если что-то не работает, можно откатиться:"
echo "  1. docker compose down"
echo "  2. systemctl enable --now postgresql redis-server nginx"
echo "  3. Восстановить PM2"
echo ""
