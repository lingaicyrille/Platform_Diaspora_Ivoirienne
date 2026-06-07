#!/bin/bash
# Daily Postgres backup — run via cron or docker exec
# Cron example (host): 0 2 * * * /opt/pdi/scripts/backup_postgres.sh >> /var/log/pdi-backup.log 2>&1
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/backups/postgres}"
RETAIN_DAYS="${RETAIN_DAYS:-7}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="${BACKUP_DIR}/pdi_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "[$(date -Iseconds)] Starting backup → ${FILENAME}"

docker exec pdi-db-1 pg_dump \
  -U "${POSTGRES_USER}" \
  -d "${POSTGRES_DB}" \
  --no-password \
  | gzip > "$FILENAME"

echo "[$(date -Iseconds)] Backup complete ($(du -sh "$FILENAME" | cut -f1))"

# Remove backups older than RETAIN_DAYS
find "$BACKUP_DIR" -name "pdi_*.sql.gz" -mtime "+${RETAIN_DAYS}" -delete
echo "[$(date -Iseconds)] Old backups pruned (kept last ${RETAIN_DAYS} days)"
