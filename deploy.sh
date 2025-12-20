#!/usr/bin/env bash
set -euo pipefail

export $(grep -v '^#' .env.production | xargs)
echo "[+] Using API base URL: $VITE_BACKEND_API_URL"

REMOTE_HOST="ubuntu@ec2-65-1-147-8.ap-south-1.compute.amazonaws.com"
SSH_KEY="/home/venkatesh/Downloads/billingv2.pem"
REMOTE_DIR="/home/ubuntu/myerpv3-frontend"

echo "==> Checking git status (must be clean)"
if [ -n "$(git status --porcelain)" ]; then
  echo "Uncommitted/untracked changes present. Commit/stash before deploying."
  exit 1
fi

echo "[+] Cleaning previous build"
rm -rf .next dist out

echo "[+] Building Next.js"
npm run build

git add .
git commit -m "Build frontend"

echo "==> Pushing to remote"
git push origin -f

echo "==> SSH to server"
ssh -i "$SSH_KEY" "$REMOTE_HOST" bash -l << EOF
  #!/usr/bin/env bash
  set -euo pipefail
  cd "$REMOTE_DIR"
  echo "[Remote] Running sync.sh..."
  bash sync.sh
EOF

echo "==> ✅ Remote sync completed successfully"