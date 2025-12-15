#!/usr/bin/env bash
set -e
git pull -ff
chmod +x *.sh
/usr/local/bin/pm2 restart frontend