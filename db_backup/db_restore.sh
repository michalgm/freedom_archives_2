#!/bin/bash
# DB_NAME=$1
BACKUP_PATH=$1

SCRIPTPATH=$(cd ${0%/*} && pwd -P)
CONFIG_FILE_PATH="${SCRIPTPATH}/pg_backup.config"

if [ ! -r ${CONFIG_FILE_PATH} ] ; then
        echo "Could not load config file from ${CONFIG_FILE_PATH}" 1>&2
        exit 1
fi

source "${CONFIG_FILE_PATH}"
type -a pg_restore

pg_restore -e --clean --create --dbname freedom_archives -h "$HOSTNAME" -U "$USERNAME" < $BACKUP_PATH