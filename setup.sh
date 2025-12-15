#!/usr/bin/env bash
set -eu
PORT=8000

git pull -ff
FRONTEND_DIR="$(cd "$(dirname "$0")" && pwd)"
pm2 delete frontend | true
pm2 start "serve $FRONTEND_DIR/dist -l $PORT" --name frontend
pm2 save