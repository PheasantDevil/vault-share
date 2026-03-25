#!/usr/bin/env bash
# 1Password Connect API トークンを Secret Manager に登録し、
# GitHub Actions 用 SA と Cloud Run 実行 SA に secretAccessor を付与する。
#
# 使い方（初回・トークンを環境変数で渡す）:
#   export GCP_PROJECT_ID=vault-share-dev
#   export OP_CONNECT_TOKEN='op_connect_...'   # 1Password で発行したトークン
#   ./scripts/gcp/setup-onepassword-connect-secret.sh
#
# シークレットが既にある場合は IAM のみ更新し、トークン更新は:
#   echo -n 'NEW_TOKEN' | gcloud secrets versions add vault-share-onepassword-connect-token --data-file=- --project="$GCP_PROJECT_ID"

set -euo pipefail

PROJECT_ID="${GCP_PROJECT_ID:-vault-share-dev}"
SECRET_NAME="${OP_CONNECT_SECRET_NAME:-vault-share-onepassword-connect-token}"
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
  if [ -z "${OP_CONNECT_TOKEN:-}" ]; then
    echo "error: シークレットが未作成です。OP_CONNECT_TOKEN を設定するか、次で手動作成してください:" >&2
    echo "  echo -n 'TOKEN' | gcloud secrets create $SECRET_NAME --data-file=- --project=$PROJECT_ID --replication-policy=automatic" >&2
    exit 1
  fi
  echo -n "$OP_CONNECT_TOKEN" | gcloud secrets create "$SECRET_NAME" \
    --project="$PROJECT_ID" \
    --data-file=- \
    --replication-policy=automatic
  echo "created secret: $SECRET_NAME"
else
  echo "secret already exists: $SECRET_NAME (IAM のみ付与。トークン更新は gcloud secrets versions add を使用)"
fi

echo "binding secretAccessor for $GITHUB_SA"
grant_accessor "serviceAccount:${GITHUB_SA}" || true

echo "binding secretAccessor for Cloud Run default SA $RUNTIME_SA"
grant_accessor "serviceAccount:${RUNTIME_SA}" || true

echo "done."
