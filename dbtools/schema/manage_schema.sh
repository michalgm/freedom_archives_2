#!/bin/bash
ACTION=$1
TARGET_ENV=${2:-"local"}

set -e

MIGRATIONS_PATH="../../migrations"

if [ "$ACTION" = "dump" ]; then
  source ../read_pg_config.sh local
  for i in freedom_archives public_search; do
    echo "
    CREATE EXTENSION IF NOT EXISTS pg_trgm;
    CREATE EXTENSION IF NOT EXISTS btree_gin;
    CREATE EXTENSION IF NOT EXISTS btree_gist;
    " >$i.sql
    ./pgschema dump --schema $i >>$i.sql
  done
elif [ "$ACTION" = "create" ]; then
  source ../read_pg_config.sh $TARGET_ENV
  MIGRATION_NAME="${3:-"migration"}"
  # MIGRATION_NAME="$(date +%Y%m%d%H%M%S)-${2:-"migration"}"

  echo "
export const up = async function (knex) {
    " >../../migrations/"$MIGRATION_NAME".js
  for i in freedom_archives public_search; do
    echo "
    await knex.raw(\`SET LOCAL search_path = '${i}';\`);
    await knex.raw(\`
$(
      ./pgschema plan --schema $i --file ./$i.sql --output-human $MIGRATIONS_PATH/"$MIGRATION_NAME".$i.txt --output-sql stdout
    )
    \`);
    await knex.raw(\`SET LOCAL search_path = 'freedom_archives';\`);
    " >>$MIGRATIONS_PATH/"$MIGRATION_NAME".js
    cat $MIGRATIONS_PATH/"$MIGRATION_NAME".$i.txt >>$MIGRATIONS_PATH/"$MIGRATION_NAME".txt
    rm $MIGRATIONS_PATH/"$MIGRATION_NAME".$i.txt
  done
  echo "};
  
export const down = async function (knex) {
};
  " >>$MIGRATIONS_PATH/"$MIGRATION_NAME".js
elif [ "$ACTION" = "apply" ]; then
  if [ "$TARGET_ENV" = "local" ]; then
    source ../read_pg_config.sh local
    ./pgschema apply --file ./freedom_archives.sql --schema freedom_archives --db freedom_archives --auto-approve
    ./pgschema apply --file ./public_search.sql --schema public_search --db freedom_archives --auto-approve
  else
    export NODE_ENV=production
    yarn knex migrate:up
  fi
else
  echo "Usage: $0 [dump | create [migration_name] | apply [local | prod]]"
fi
