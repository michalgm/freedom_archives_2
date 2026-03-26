#!/bin/bash
set -e
set -x
BLUE='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m' # No Color

log() {
  echo -e "${BLUE}$(date) ${RED}$*${NC}\n"
}

# Check if jq is installed
if ! command -v jq &>/dev/null; then
  log "Error: jq is not installed. Please install it first."
  exit 1
fi

# Extract database connection details from config files
LOCAL_CONFIG_FILE="../config/development.json"
REMOTE_CONFIG_FILE="../config/production.json"

if [ ! -f "$REMOTE_CONFIG_FILE" ]; then
  log "Error: Production config file not found at $REMOTE_CONFIG_FILE"
  exit 1
fi

# Extract local database connection details
LOCAL_HOST=$(jq -r '.postgresql.connection.host' $LOCAL_CONFIG_FILE)
LOCAL_PASSWORD=$(jq -r '.postgresql.connection.password' $LOCAL_CONFIG_FILE)
LOCAL_SCHEMA=$(jq -r '.postgresql.searchPath[0]' $LOCAL_CONFIG_FILE)
LOCAL_USER=$(jq -r '.postgresql.connection.user // env.USER' $LOCAL_CONFIG_FILE)
LOCAL_DB=$(jq -r '.postgresql.connection.database // env.USER' $LOCAL_CONFIG_FILE)
LOCAL_PORT=$(jq -r '.postgresql.connection.port // "5432"' $LOCAL_CONFIG_FILE)

# Extract remote database connection details
REMOTE_HOST=$(jq -r '.postgresql.connection.host' $REMOTE_CONFIG_FILE)
REMOTE_PASSWORD=$(jq -r '.postgresql.connection.password' $REMOTE_CONFIG_FILE)
REMOTE_SCHEMA=$(jq -r '.postgresql.searchPath[0]' $REMOTE_CONFIG_FILE)
REMOTE_USER=$(jq -r '.postgresql.connection.user // env.USER' $REMOTE_CONFIG_FILE)
REMOTE_DB=$(jq -r '.postgresql.connection.database // env.USER' $REMOTE_CONFIG_FILE)
REMOTE_PORT=$(jq -r '.postgresql.connection.port // "5432"' $REMOTE_CONFIG_FILE)

# Set up SSH tunnel if remote host is not an IP address
SSH_TUNNEL=false
# if [[ ! $REMOTE_HOST =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
#   SSH_TUNNEL=true
#   SSH_HOST=$REMOTE_HOST
#   TUNNEL_PORT=5433
#   log "Setting up SSH tunnel to $SSH_HOST"

#   if [[ -f ~/.ssh/db_export.ctl ]]; then
#     rm ~/.ssh/db_export.ctl
#   fi

#   ssh -f -N -T -M -L $TUNNEL_PORT:127.0.0.1:5432 -o ControlPath=~/.ssh/db_export.ctl $SSH_HOST
#   REMOTE_HOST="127.0.0.1"
#   REMOTE_PORT=$TUNNEL_PORT
# fi
sync_schema() {
  LOCAL_SCHEMA=$1
  REMOTE_SCHEMA=$2
  SKIP_DATA=$3
  log "Dumping local database schema $LOCAL_SCHEMA from $LOCAL_DB"
  # echo PGPASSWORD=$LOCAL_PASSWORD pg_dump -h $LOCAL_HOST -p $LOCAL_PORT -U $LOCAL_USER -n $LOCAL_SCHEMA -O -c --if-exists $LOCAL_DB
  # exit
  PGPASSWORD=$LOCAL_PASSWORD pg_dump -h "$LOCAL_HOST" -p "$LOCAL_PORT" -U "$LOCAL_USER" -n "$LOCAL_SCHEMA" -e '*' -s -O "$LOCAL_DB" >schema_dump.sql

  if [ "$SKIP_DATA" = true ]; then
    log "Skipping data dump"
  else
    log "Dumping local database data $LOCAL_SCHEMA from $LOCAL_DB"
    PGPASSWORD=$LOCAL_PASSWORD pg_dump -h "$LOCAL_HOST" -p "$LOCAL_PORT" -U "$LOCAL_USER" -n "$LOCAL_SCHEMA" --data-only -T snapshots "$LOCAL_DB" >data_dump.sql
  fi
  set +e
  log "Creating backup of remote schema $REMOTE_SCHEMA"
  PGPASSWORD=$REMOTE_PASSWORD pg_dump -h "$REMOTE_HOST" -p "$REMOTE_PORT" -U "$REMOTE_USER" -n "$REMOTE_SCHEMA" "$REMOTE_DB" >remote_backup.sql
  set -e

  log "Applying schema $LOCAL_SCHEMA to remote database $REMOTE_DB $REMOTE_SCHEMA"
  PGPASSWORD=$REMOTE_PASSWORD psql -h "$REMOTE_HOST" -p "$REMOTE_PORT" -U "$REMOTE_USER" -d "$REMOTE_DB" -c "DROP SCHEMA IF EXISTS ${REMOTE_SCHEMA}_backup CASCADE;"

  PGPASSWORD=$REMOTE_PASSWORD psql -h "$REMOTE_HOST" -p "$REMOTE_PORT" -U "$REMOTE_USER" -d "$REMOTE_DB" -c "DROP SCHEMA IF EXISTS ${REMOTE_SCHEMA} CASCADE;"

  PGPASSWORD=$REMOTE_PASSWORD psql -h "$REMOTE_HOST" -p "$REMOTE_PORT" -U "$REMOTE_USER" -d "$REMOTE_DB" -c "CREATE SCHEMA $REMOTE_SCHEMA;"

  # set +e
  # PGPASSWORD=$REMOTE_PASSWORD psql -h "$REMOTE_HOST" -p "$REMOTE_PORT" -U "$REMOTE_USER" -d "$REMOTE_DB" -c "ALTER SCHEMA $REMOTE_SCHEMA RENAME TO ${REMOTE_SCHEMA}_backup;"

  if [ "$REMOTE_SCHEMA" = "freedom_archives" ]; then
    PGPASSWORD=$REMOTE_PASSWORD psql -h "$REMOTE_HOST" -p "$REMOTE_PORT" -U "$REMOTE_USER" -d "$REMOTE_DB" -c "DROP EXTENSION IF EXISTS pg_trgm; CREATE EXTENSION pg_trgm with schema $REMOTE_SCHEMA;"
  fi

  set -e
  PGPASSWORD=$REMOTE_PASSWORD psql -h "$REMOTE_HOST" -p "$REMOTE_PORT" -U "$REMOTE_USER" -d "$REMOTE_DB" <schema_dump.sql

  if [ "$SKIP_DATA" = true ]; then
    log "Skipping data copy"
  else
    log "Copying data to remote database $REMOTE_DB"
    PGPASSWORD=$REMOTE_PASSWORD psql -h "$REMOTE_HOST" -p "$REMOTE_PORT" -U "$REMOTE_USER" -d "$REMOTE_DB" <data_dump.sql
  fi
}

sync_schema "freedom_archives" "freedom_archives"
sync_schema "public_search" "public_search" true

log "Running VACUUM ANALYZE on remote database $REMOTE_DB"
PGPASSWORD=$REMOTE_PASSWORD psql -h "$REMOTE_HOST" -p "$REMOTE_PORT" -U "$REMOTE_USER" -d "$REMOTE_DB" -c "VACUUM ANALYZE;"

# Clean up SSH tunnel if used
if [ "$SSH_TUNNEL" = true ]; then
  log "Closing SSH tunnel"
  ssh -T -O "exit" -o ControlPath=~/.ssh/db_export.ctl "$SSH_HOST"
fi

log "Database copy completed successfully!"
log "A backup of the remote schema was saved as ${REMOTE_SCHEMA}_backup"
log "Local dumps saved as schema_dump.sql and data_dump.sql"
