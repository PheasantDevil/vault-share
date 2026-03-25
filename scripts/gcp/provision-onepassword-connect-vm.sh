#!/usr/bin/env bash
# GCE に 1Password Connect 用 VM とファイアウォールを（冪等に）作成する。
# VM 内の Docker / Compose は別途: install-connect-on-vm.sh または手動。
#
#   export GCP_PROJECT_ID=vault-share-dev
#   ./scripts/gcp/provision-onepassword-connect-vm.sh

set -euo pipefail

PROJECT_ID="${GCP_PROJECT_ID:-vault-share-dev}"
ZONE="${GCP_ZONE:-asia-northeast1-a}"
VM_NAME="${GCP_VM_NAME:-onepassword-connect}"
MACHINE_TYPE="${GCP_MACHINE_TYPE:-e2-small}"
TAG="connect-server"

ensure_fw() {
  local name="$1" desc="$2" rules="$3" sources="$4"
  if gcloud compute firewall-rules describe "$name" --project="$PROJECT_ID" &>/dev/null; then
    echo "firewall exists: $name"
  else
    gcloud compute firewall-rules create "$name" \
      --project="$PROJECT_ID" \
      --direction=INGRESS \
      --action=ALLOW \
      --rules="$rules" \
      --target-tags="$TAG" \
      --source-ranges="$sources" \
      --description="$desc" \
      --quiet
    echo "created firewall: $name"
  fi
}

echo "enabling compute.googleapis.com (if needed)..."
gcloud services enable compute.googleapis.com --project="$PROJECT_ID" --quiet

ensure_fw "allow-connect-https" "HTTP/HTTPS for Caddy or ACME" "tcp:80,tcp:443" "0.0.0.0/0"
ensure_fw "allow-ssh-iap-connect" "SSH via IAP" "tcp:22" "35.235.240.0/20"
ensure_fw "allow-connect-op-api" "1Password Connect API" "tcp:8080,tcp:8081" "0.0.0.0/0"

if ! gcloud compute firewall-rules describe allow-connect-ssh-bootstrap --project="$PROJECT_ID" &>/dev/null; then
  echo "creating allow-connect-ssh-bootstrap (SSH 0.0.0.0/0) — 本番前に削除推奨"
  gcloud compute firewall-rules create allow-connect-ssh-bootstrap \
    --project="$PROJECT_ID" \
    --direction=INGRESS \
    --action=ALLOW \
    --rules=tcp:22 \
    --target-tags="$TAG" \
    --source-ranges=0.0.0.0/0 \
    --description="TEMP bootstrap SSH; delete after IAP-only" \
    --quiet
fi

if gcloud compute instances describe "$VM_NAME" --zone="$ZONE" --project="$PROJECT_ID" &>/dev/null; then
  echo "VM already exists: $VM_NAME"
else
  echo "creating VM $VM_NAME..."
  gcloud compute instances create "$VM_NAME" \
    --project="$PROJECT_ID" \
    --zone="$ZONE" \
    --machine-type="$MACHINE_TYPE" \
    --boot-disk-size=20GB \
    --image-family=ubuntu-2204-lts \
    --image-project=ubuntu-os-cloud \
    --tags="$TAG" \
    --metadata=enable-oslogin=TRUE \
    --quiet
fi

EXTERNAL_IP="$(gcloud compute instances describe "$VM_NAME" \
  --zone="$ZONE" \
  --project="$PROJECT_ID" \
  --format='get(networkInterfaces[0].accessConfigs[0].natIP)')"

echo ""
echo "=== 次のステップ ==="
echo "1) VM に Docker + Compose で Connect を入れる:"
echo "   CREDENTIALS_JSON=./path/to/1password-credentials.json \\"
echo "   ./scripts/gcp/install-connect-on-vm.sh \"\$CREDENTIALS_JSON\""
echo ""
echo "2) GitHub Actions の Secret ONEPASSWORD_CONNECT_URL に次を設定（末尾スラッシュなし）:"
echo "   http://${EXTERNAL_IP}:8080"
echo ""
echo "3) Secret Manager にトークンを入れる:"
echo "   export OP_CONNECT_TOKEN='...' && ./scripts/gcp/setup-onepassword-connect-secret.sh"
echo ""
