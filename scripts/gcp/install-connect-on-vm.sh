#!/usr/bin/env bash
# ローカルの 1password-credentials.json とリポジトリの docker-compose を GCE VM に送り、Connect を起動する。
# 前提: provision-onepassword-connect-vm.sh 済み、VM に SSH 可能。
#
#   export GCP_PROJECT_ID=vault-share-dev
#   ./scripts/gcp/install-connect-on-vm.sh /path/to/1password-credentials.json

set -euo pipefail

if [ "${1:-}" = "" ] || [ ! -f "$1" ]; then
  echo "usage: $0 /path/to/1password-credentials.json" >&2
  exit 1
fi

CREDENTIALS="$1"
PROJECT_ID="${GCP_PROJECT_ID:-vault-share-dev}"
ZONE="${GCP_ZONE:-asia-northeast1-a}"
VM_NAME="${GCP_VM_NAME:-onepassword-connect}"
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
COMPOSE_SRC="${REPO_ROOT}/infra/1password-connect/docker-compose.yaml"

if [ ! -f "$COMPOSE_SRC" ]; then
  echo "missing $COMPOSE_SRC" >&2
  exit 1
fi

echo "installing Docker on VM (if needed)..."
gcloud compute ssh "$VM_NAME" --zone="$ZONE" --project="$PROJECT_ID" --command='
set -e
if ! command -v docker &>/dev/null; then
  sudo apt-get update -qq
  sudo apt-get install -y -qq ca-certificates curl
  curl -fsSL https://get.docker.com | sudo sh
  sudo systemctl enable --now docker
fi
docker --version
mkdir -p ~/connect && chmod 700 ~/connect
'

echo "copying credentials and compose..."
gcloud compute scp "$CREDENTIALS" "${VM_NAME}:~/connect/1password-credentials.json" \
  --zone="$ZONE" --project="$PROJECT_ID"
gcloud compute scp "$COMPOSE_SRC" "${VM_NAME}:~/connect/docker-compose.yaml" \
  --zone="$ZONE" --project="$PROJECT_ID"

echo "starting containers..."
gcloud compute ssh "$VM_NAME" --zone="$ZONE" --project="$PROJECT_ID" --command='
cd ~/connect
sudo docker compose pull
sudo docker compose up -d
sudo docker compose ps
curl -sS -o /dev/null -w "GET /v1/vaults -> HTTP %{http_code}\n" http://127.0.0.1:8080/v1/vaults || true
'

echo "done."
