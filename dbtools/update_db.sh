#!/bin/bash
BLUE='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m' # No Color

SOURCE_DB=mysql://claude_search:$(cat .mysql-opts)@127.0.0.1:3307/claude_search
TARGET_DB=postgresql://dameat:1234@localhost/dameat

log() {
  echo -e "${BLUE}$(date) ${RED}$@${NC}\n"
}

set -e
if [[ -n $1 ]]; then
  log "### Update mysql from live data"
  if [[ -f ~/.ssh/db_import.ctl ]]; then
    rm ~/.ssh/db_import.ctl
  fi
  pkill -f "ssh -f -N -T -M -L 3307:127.0.0.1:3306" || true
  ssh -f -N -T -M -L 3307:127.0.0.1:3306 -o ControlPath=~/.ssh/db_import.ctl freedomarc
  docker run --rm -it --network host ghcr.io/dimitri/pgloader:latest pgloader $SOURCE_DB $TARGET_DB
  # exit

  # pgloader mysql://claude_search:`cat .mysql-opts`@127.0.0.1:3307/claude_search postgresql:///
  ssh -T -O "exit" -o ControlPath=~/.ssh/db_import.ctl freedomarc
  psql -c "drop schema if exists freedom_archives_old cascade; alter schema claude_search rename to freedom_archives_old;"
else
  log "### skipping live data update"
fi
log "### Update local schema"


(
  echo "BEGIN;"
  echo "\timing"
  for file in $(ls -1 schema_import/*.sql | sort); do
    echo "-- Processing $file"
    cat "$file"
  done
  echo "COMMIT;"

) | psql -b -v ON_ERROR_STOP=1;

echo "Run migrate"
# psql -b -v ON_ERROR_STOP=1 <./update_schema.sql
# psql -a -v ON_ERROR_STOP=1 <../backend/migrations/02-snapshots.sql
npm run migrate

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
