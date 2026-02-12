#!/bin/bash
# =============================================================================
# PostgreSQL Backup Script
# =============================================================================
# Создаёт бэкап БД и удаляет старые (хранит последние 7)
#
# Использование:
#   ./backup.sh              # Ручной запуск
#   crontab -e               # Автоматический запуск (см. ниже)
#
# Cron (каждый день в 3:00):
#   0 3 * * * /path/to/deploy/backup.sh >> /var/log/postgres-backup.log 2>&1
# =============================================================================

set -e

# Настройки
BACKUP_DIR="$(dirname "$0")/backups"
CONTAINER_NAME="postcard-postgres"
DB_USER="${POSTGRES_USER:-postcard_bot}"
DB_NAME="${POSTGRES_DB:-postcard_bot}"
KEEP_DAYS=7

# Создаём директорию для бэкапов
mkdir -p "$BACKUP_DIR"

# Имя файла с датой
BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql.gz"

echo "[$(date)] Starting backup..."

# Создаём бэкап (сжатый)
docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"

# Проверяем что файл создался
if [ -f "$BACKUP_FILE" ] && [ -s "$BACKUP_FILE" ]; then
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "[$(date)] Backup created: $BACKUP_FILE ($SIZE)"
else
    echo "[$(date)] ERROR: Backup failed!"
    exit 1
fi

# Удаляем старые бэкапы (старше KEEP_DAYS дней)
find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +$KEEP_DAYS -delete
echo "[$(date)] Old backups cleaned (keeping last $KEEP_DAYS days)"

echo "[$(date)] Backup completed successfully"
