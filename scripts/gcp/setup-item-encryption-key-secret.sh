#!/usr/bin/env bash
# アイテム暗号化キー（32 バイト base64）を Secret Manager に登録し、
# GitHub Actions 用 SA と Cloud Run 実行 SA に secretAccessor を付与する。
#
# 初回（ランダム生成）:
#   export GCP_PROJECT_ID=vault-share-dev
#   ./scripts/gcp/setup-item-encryption-key-secret.sh
#
# 既存の .env.local の値を使う場合:
#   export ITEM_ENCRYPTION_KEY="$(grep '^ITEM_ENCRYPTION_KEY=' apps/web/.env.local | cut -d= -f2-)"
#   ./scripts/gcp/setup-item-encryption-key-secret.sh
#
# 更新:
#   echo -n 'BASE64_32_BYTES' | gcloud secrets versions add vault-share-item-encryption-key --data-file=- --project="$GCP_PROJECT_ID"

set -euo pipefail

PROJECT_ID="${GCP_PROJECT_ID:-vault-share-dev}"
SECRET_NAME="${ITEM_ENCRYPTION_SECRET_NAME:-vault-share-item-encryption-key}"
GITHUB_SA="github-actions@${PROJECT_ID}.iam.gserviceaccount.com"

PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"
RUNTIME_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

grant_accessor() {
  local member="$1"
  gcloud secrets add-iam-policy-binding "$SECRET_NAME" \
    --project="$PROJECT_ID" \
    --member="$member" \
    --role="roles/secretmanager.secretAccessor" \
    --quiet
}

if ! gcloud secrets describe "$SECRET_NAME" --project="$PROJECT_ID" &>/dev/null; then
  if [ -z "${ITEM_ENCRYPTION_KEY:-}" ]; then
    ITEM_ENCRYPTION_KEY="$(openssl rand -base64 32)"
    echo "generated new ITEM_ENCRYPTION_KEY (32-byte base64)"
  fi
  # 改行なしで保存（encrypt が Buffer.from(key, 'base64') で 32 バイトになること）
  echo -n "$ITEM_ENCRYPTION_KEY" | gcloud secrets create "$SECRET_NAME" \
    --project="$PROJECT_ID" \
    --data-file=- \
    --replication-policy=automatic
  echo "created secret: $SECRET_NAME"
else
  echo "secret already exists: $SECRET_NAME (IAM のみ付与。値の更新は gcloud secrets versions add を使用)"
fi

echo "binding secretAccessor for $GITHUB_SA"
grant_accessor "serviceAccount:${GITHUB_SA}" || true

echo "binding secretAccessor for Cloud Run default SA $RUNTIME_SA"
grant_accessor "serviceAccount:${RUNTIME_SA}" || true

echo "done. Cloud Run には ITEM_ENCRYPTION_KEY としてマウントされます（deploy.yml の --set-secrets）。"
