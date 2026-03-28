# Secret Manager 設定手順

## 概要

`SESSION_SECRET` を Google Cloud Secret Manager に保存し、Cloud Run デプロイ時に自動的に読み込むように設定します。

## 前提条件

- GCP プロジェクト `vault-share-dev` にアクセス権限があること
- `gcloud` コマンドがインストールされ、認証済みであること
- サービスアカウント `github-actions@vault-share-dev.iam.gserviceaccount.com` が存在すること

## 設定手順

### 1. SESSION_SECRET の値を確認

`.env.local` ファイルから `SESSION_SECRET` の値を確認します：

```bash
grep "^SESSION_SECRET=" apps/web/.env.local | cut -d'=' -f2-
```

### 2. Secret Manager にシークレットを作成

```bash
# SESSION_SECRET の値を Secret Manager に保存
echo -n "YOUR_SESSION_SECRET_VALUE" | gcloud secrets create vault-share-session-secret \
  --data-file=- \
  --project=vault-share-dev \
  --replication-policy="automatic"
```

**注意**: `YOUR_SESSION_SECRET_VALUE` を実際の値に置き換えてください。`echo -n` を使用することで、末尾の改行が含まれないようにします。

### 3. サービスアカウントに Secret Manager の読み取り権限を付与

GitHub Actions のサービスアカウントに Secret Manager の読み取り権限を付与します：

```bash
gcloud secrets add-iam-policy-binding vault-share-session-secret \
  --member="serviceAccount:github-actions@vault-share-dev.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=vault-share-dev
```

### 4. Cloud Run サービスアカウントに権限を付与（必要に応じて）

Cloud Run サービスが Secret Manager からシークレットを読み込むため、Cloud Run のサービスアカウントにも権限を付与する必要がある場合があります：

```bash
# Cloud Run のデフォルトサービスアカウントに権限を付与
gcloud secrets add-iam-policy-binding vault-share-session-secret \
  --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=vault-share-dev
```

**注意**: `PROJECT_NUMBER` を実際のプロジェクト番号に置き換えてください。プロジェクト番号は以下のコマンドで取得できます：

```bash
gcloud projects describe vault-share-dev --format='value(projectNumber)'
```

## 確認方法

### Secret Manager にシークレットが作成されたか確認

```bash
gcloud secrets list --project=vault-share-dev --filter="name:vault-share-session-secret"
```

### シークレットの詳細を確認

```bash
gcloud secrets describe vault-share-session-secret --project=vault-share-dev
```

### IAM ポリシーを確認

```bash
gcloud secrets get-iam-policy vault-share-session-secret --project=vault-share-dev
```

## ITEM_ENCRYPTION_KEY（アイテム本文の暗号化）

グループ内アイテムの本文は AES-256-GCM で暗号化されます。本番では **32 バイトを base64 エンコードした値**を `ITEM_ENCRYPTION_KEY` として渡します（`apps/web/env.example` 参照）。

GitHub Actions のデプロイは **`vault-share-item-encryption-key`** を Secret Manager から `ITEM_ENCRYPTION_KEY` としてマウントします。**未作成のままデプロイすると `--set-secrets` が失敗する**ため、初回は次を実行してください。

```bash
export GCP_PROJECT_ID=vault-share-dev
./scripts/gcp/setup-item-encryption-key-secret.sh
```

ローカル開発と同じキーを使う場合は、事前に `export ITEM_ENCRYPTION_KEY=...`（`.env.local` の値）を設定してから実行します。キーを変更すると **既存アイテムは復号できなくなる**ため、本番ではローテーション時にデータ移行戦略が必要です。

## デプロイ時の動作

デプロイワークフロー（`.github/workflows/deploy.yml`）は Cloud Run に次をマウントします（いずれも Secret Manager の `latest`）。

1. `SESSION_SECRET` ← `vault-share-session-secret`
2. `ITEM_ENCRYPTION_KEY` ← `vault-share-item-encryption-key`
3. （任意）`ONEPASSWORD_CONNECT_TOKEN` ← `vault-share-onepassword-connect-token`

## トラブルシューティング

### Secret Manager API が有効になっていない場合

```bash
gcloud services enable secretmanager.googleapis.com --project=vault-share-dev
```

### 権限エラーが発生する場合

サービスアカウントに適切な権限が付与されているか確認してください：

```bash
# GitHub Actions サービスアカウントの権限を確認
gcloud projects get-iam-policy vault-share-dev \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:github-actions@vault-share-dev.iam.gserviceaccount.com"
```

### シークレットの値を更新する場合

```bash
echo -n "NEW_SESSION_SECRET_VALUE" | gcloud secrets versions add vault-share-session-secret \
  --data-file=- \
  --project=vault-share-dev
```

## 1Password Connect 用シークレット（任意）

Cloud Run で 1Password からのインポートを有効にする場合、別シークレット **`vault-share-onepassword-connect-token`** を使います。作成・IAM・GitHub 変数は次を参照してください。

- [`05-onepassword-connect-cloud-run.md`](./05-onepassword-connect-cloud-run.md)
- `scripts/gcp/setup-onepassword-connect-secret.sh`

## セキュリティのベストプラクティス

1. **シークレットの値は絶対にコミットしない**: `.env.local` は `.gitignore` に含まれていることを確認
2. **定期的なローテーション**: セキュリティ上の理由から、定期的に `SESSION_SECRET` をローテーションすることを推奨
3. **最小権限の原則**: 必要な権限のみを付与し、不要な権限は削除
4. **監査ログの確認**: Secret Manager のアクセスログを定期的に確認
