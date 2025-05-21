#!/bin/bash
REMOTE_CONFIG_FILE="../config/production.json"


REMOTE_HOST=$(jq -r '.postgresql.connection.host' $REMOTE_CONFIG_FILE)
REMOTE_PASSWORD=$(jq -r '.postgresql.connection.password' $REMOTE_CONFIG_FILE)
REMOTE_SCHEMA=$(jq -r '.postgresql.searchPath[0]' $REMOTE_CONFIG_FILE)
REMOTE_USER=$(jq -r '.postgresql.connection.user // env.USER' $REMOTE_CONFIG_FILE)
REMOTE_DB=$(jq -r '.postgresql.connection.database // env.USER' $REMOTE_CONFIG_FILE)
REMOTE_PORT=$(jq -r '.postgresql.connection.port // "5432"' $REMOTE_CONFIG_FILE)


export PGOPTIONS=--search_path=freedom_archives

PGPASSWORD=$REMOTE_PASSWORD psql -h $REMOTE_HOST -p $REMOTE_PORT -U $REMOTE_USER -d $REMOTE_DB 