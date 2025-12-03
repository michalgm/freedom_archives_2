#!/bin/bash

BLUE='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m' # No Color

source ./read_pg_config.sh default

SOURCE_DB=mysql://claude_search:$(cat .mysql-opts)@127.0.0.1:3307/claude_search
TARGET_DB=postgresql://$PGUSER@$PGHOST:$PGPORT/$PGDATABASE
export PGOPTIONS='--client-min-messages=warning'

log() {
  echo -e "${BLUE}$(date) ${RED}$*${NC}\n"
}

set -e
if [[ -n $1 ]]; then
  log "### Update mysql from live data"
  if [[ -f ~/.ssh/db_import.ctl ]]; then
    rm ~/.ssh/db_import.ctl
  fi
  pkill -f "ssh -f -N -T -M -L 3307:127.0.0.1:3306" || true
  ssh -f -N -T -M -L 3307:127.0.0.1:3306 -o ControlPath=~/.ssh/db_import.ctl freedomarc
  docker run --rm -it --network host -e PGPASSWORD ghcr.io/dimitri/pgloader:latest pgloader "$SOURCE_DB" "$TARGET_DB"
  # exit

  # pgloader mysql://claude_search:`cat .mysql-opts`@127.0.0.1:3307/claude_search postgresql:///
  ssh -T -O "exit" -o ControlPath=~/.ssh/db_import.ctl freedomarc
  psql "$TARGET_DB" -q -c "drop schema if exists freedom_archives_old cascade; alter schema claude_search rename to freedom_archives_old;"
else
  log "### skipping live data update"
fi

log "### refresh schema"
psql "$TARGET_DB" -q -c "drop schema if exists freedom_archives cascade; drop schema if exists public_search cascade; create schema freedom_archives; create schema public_search;"
for schema in freedom_archives public_search; do
  ./schema/pgschema apply --file ./schema/${schema}.sql --schema $schema --db freedom_archives --auto-approve >/dev/null
done

log "### Update data"
(
  echo "BEGIN;"
  # shellcheck disable=SC2028
  echo "\timing"
  for file in schema_import/00_cleanup.sql schema_import/02_import_data.sql; do
    if [[ -z $1 && $file = "schema_import/00_cleanup.sql" ]]; then
      echo "-- skipping cleanup"
      continue
    fi
    echo "-- Processing $file"
    cat "$file"
  done
  echo "COMMIT;"
) | psql -b -v ON_ERROR_STOP=1

# pg_dump -d dameat -s -N freedom_archives_old -N public -N fa_test | sed -e "s/dameat/fa_admin/g" > pre_migrate.sql

# echo "Run migrate"
# yarn run migrate
# pg_dump -d dameat -s -N freedom_archives_old -N public -N fa_test | sed -e "s/dameat/fa_admin/g" > post_migrate.sql
echo "### Publish site"
cd ../
node ./backend/scripts/publishSite.js
psql -b -c "VACUUM ANALYZE;"

# pg_dump -n freedom_archives -O -c --if-exists \
#   | grep -v lock_timeout \
#   | grep -v idle_in_transaction_session_timeout \
#   | grep -v row_security \
#   | grep -v "AS integer" \
#   | sed -e "s/MATERIALIZED //g" \
#   | grep -v "REFRESH VIEW" \
#   | sed -e "s/WITH NO DATA//g" \
#   > schema.sql
# ssh -f -N -T -M -L 5433:127.0.0.1:5432 -o ControlPath=~/.ssh/db_import.ctl freedomarc
# PGPASSWORD=`cat .mysql-opts` psql -U claude_admin -h 127.0.0.1 -p 5433 claude_search_dev -c "drop view if exists records_view_2"
# PGPASSWORD=`cat .mysql-opts` psql -U claude_admin -h 127.0.0.1 -p 5433 claude_search_dev < schema.sql
# ssh -T -O "exit" -o ControlPath=~/.ssh/db_import.ctl freedomarc
