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

## デプロイ時の動作

デプロイワークフロー（`.github/workflows/deploy.yml`）は以下のように動作します：

1. `vault-share-session-secret` が存在するか確認
2. 存在する場合、Cloud Run デプロイ時に `--set-secrets="SESSION_SECRET=vault-share-session-secret:latest"` を追加
3. Cloud Run サービスが起動時に Secret Manager から `SESSION_SECRET` を読み込む

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

## セキュリティのベストプラクティス

1. **シークレットの値は絶対にコミットしない**: `.env.local` は `.gitignore` に含まれていることを確認
2. **定期的なローテーション**: セキュリティ上の理由から、定期的に `SESSION_SECRET` をローテーションすることを推奨
3. **最小権限の原則**: 必要な権限のみを付与し、不要な権限は削除
4. **監査ログの確認**: Secret Manager のアクセスログを定期的に確認
