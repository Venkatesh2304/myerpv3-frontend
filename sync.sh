#!/usr/bin/env bash
set -e
git pull -ff
chmod +x *.sh
/home/ubuntu/.nvm/versions/node/v22.14.0/bin/pm2 restart frontend