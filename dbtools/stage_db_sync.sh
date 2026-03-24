#!/bin/bash
source ./read_pg_config.sh production
PROD_CONN="postgresql://$PGUSER:$PGPASSWORD@$PGHOST:$PGPORT/$PGDATABASE"

source ./read_pg_config.sh stage
STAGE_CONN="postgresql://$PGUSER:$PGPASSWORD@$PGHOST:$PGPORT/$PGDATABASE"

export PGOPTIONS="--search_path=freedom_archives,pg_catalog --client-min-messages=warning"

for schema in freedom_archives public_search; do
  echo "Syncing schema: $schema"
  psql -q "$STAGE_CONN" -c "DROP SCHEMA IF EXISTS $schema CASCADE;"
  if [ "$schema" = "freedom_archives" ]; then
    psql -q "$STAGE_CONN" -c "CREATE SCHEMA $schema;"
    psql -q "$STAGE_CONN" -c "CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA freedom_archives;"
    psql -q "$STAGE_CONN" -c "CREATE EXTENSION IF NOT EXISTS btree_gin WITH SCHEMA freedom_archives;"
    psql -q "$STAGE_CONN" -c "CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA freedom_archives;"
  fi
  pg_dump "$PROD_CONN" -n "$schema" --no-owner --no-privileges |
    psql -q "$STAGE_CONN" >/dev/null
done
