#!/bin/bash

ENV=${1:-default}
if [ -n "$1" ]; then
  ENV=$1
  shift
else
  ENV=default
fi

if [ "$ENV" == "p" ] || [ "$ENV" == "prod" ]; then
  ENV="production"
fi

if [ "$ENV" != "default" ] && [ "$ENV" != "production" ]; then
  echo "Unknown environment: $ENV"
  exit 1
fi
source ./read_pg_config.sh $ENV

psql "$@"
