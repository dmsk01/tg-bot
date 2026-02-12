#!/bin/bash
# =============================================================================
# PostgreSQL Restore Script
# =============================================================================
# Восстанавливает БД из бэкапа
#
# Использование:
#   ./restore.sh backups/backup_20240115_030000.sql.gz
# =============================================================================

set -e

BACKUP_FILE="$1"
CONTAINER_NAME="postcard-postgres"
DB_USER="${POSTGRES_USER:-postcard_bot}"
DB_NAME="${POSTGRES_DB:-postcard_bot}"

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file.sql.gz>"
    echo ""
    echo "Available backups:"
    ls -la "$(dirname "$0")/backups/" 2>/dev/null || echo "  No backups found"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "ERROR: File not found: $BACKUP_FILE"
    exit 1
fi

echo "WARNING: This will REPLACE all data in database '$DB_NAME'!"
echo "Backup file: $BACKUP_FILE"
read -p "Are you sure? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Cancelled."
    exit 0
fi

echo "[$(date)] Stopping backend..."
docker stop postcard-backend 2>/dev/null || true

echo "[$(date)] Restoring from $BACKUP_FILE..."

# Восстанавливаем (drop + create всех объектов)
gunzip -c "$BACKUP_FILE" | docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" --quiet

echo "[$(date)] Starting backend..."
docker start postcard-backend

echo "[$(date)] Restore completed successfully"
