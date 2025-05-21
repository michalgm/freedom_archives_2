#!/bin/bash
set -e
NO_BUILD=$1

if [ -z "$NO_BUILD" ]; then
    echo "Updating frontend..."
    cd ../frontend
    ssh freedomarc "set -x && cd work/frontend && \
        git pull && \
        .  ./activate.sh && \
        cd frontend && \
        npm install && \
    npm run build"
fi

echo "Updating backend..."
ssh freedomarc "cd work/freedom_archives_2 && \
    git pull && \
    .  ./activate.sh && \
    npm install && \
    NODE_ENV=production npm run migrate && \
    /usr/sbin/cloudlinux-selector restart --interpreter nodejs --app-root work/freedom_archives_2 --json"
    