#!/bin/bash

DEST_ENV=${1:-"stage"}

source ./read_pg_config.sh production
SOURCE_CONN="postgresql://$PGUSER:$PGPASSWORD@$PGHOST:$PGPORT/$PGDATABASE"

source ./read_pg_config.sh "$DEST_ENV"
DEST_CONN="postgresql://$PGUSER:$PGPASSWORD@$PGHOST:$PGPORT/$PGDATABASE"

export PGOPTIONS="--search_path=freedom_archives,pg_catalog --client-min-messages=warning"

echo "Syncing database schema from production to $DEST_ENV environment"
echo "Are you sure you want to proceed? This will DROP and RECREATE the schemas in the destination database. (yes/no)"
read -r CONFIRMATION
if [ "$CONFIRMATION" != "yes" ] && [ "$CONFIRMATION" != "y" ]; then
  echo "Aborting."
  exit 1
fi


for schema in freedom_archives public_search; do
  echo "Syncing schema: $schema"
  psql -q "$DEST_CONN" -c "DROP SCHEMA IF EXISTS $schema CASCADE;"
  if [ "$schema" = "freedom_archives" ]; then
    psql -q "$DEST_CONN" -c "CREATE SCHEMA $schema;"
    psql -q "$DEST_CONN" -c "CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA freedom_archives;"
    psql -q "$DEST_CONN" -c "CREATE EXTENSION IF NOT EXISTS btree_gin WITH SCHEMA freedom_archives;"
    psql -q "$DEST_CONN" -c "CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA freedom_archives;"
  fi
  pg_dump "$SOURCE_CONN" -n "$schema" --no-owner --no-privileges |
    psql -q "$DEST_CONN" >/dev/null
done
