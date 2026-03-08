# CI/CD 設定：手動設定が必要な項目

GitHub Actions から Cloud Run にデプロイするため、以下の手動設定を行ってください。**GCP 側の OIDC・Artifact Registry・サービスアカウント等は既にコマンドで実行済み**です。

---

## 1. GitHub リポジトリ変数の設定（必須）

GitHub の **Settings** → **Secrets and variables** → **Actions** → **Variables** で、**New repository variable** を押し、以下 4 つを追加する。

| 変数名                       | 値                                                                                                      |
| ---------------------------- | ------------------------------------------------------------------------------------------------------- |
| `GCP_PROJECT_ID`             | `vault-share-dev`                                                                                       |
| `GCP_REGION`                 | `asia-northeast1`                                                                                       |
| `WORKLOAD_IDENTITY_PROVIDER` | `projects/vault-share-dev/locations/global/workloadIdentityPools/github-pool/providers/github-provider` |
| `SERVICE_ACCOUNT`            | `github-actions@vault-share-dev.iam.gserviceaccount.com`                                                |

**手順**:

1. リポジトリ `PheasantDevil/vault-share` の **Settings** を開く
2. 左メニュー **Secrets and variables** → **Actions**
3. **Variables** タブを選択
4. **New repository variable** をクリック
5. 上表の各変数について **Name** と **Value** を入力して保存

---

## 2. Cloud Run の環境変数（初回デプロイ後に実施）

初回デプロイで Cloud Run サービス `vault-share-web` が作成されたあと、本番用の環境変数を設定する。

**方法 A: gcloud コマンド**

```bash
gcloud run services update vault-share-web \
  --region=asia-northeast1 \
  --project=vault-share-dev \
  --set-env-vars="NEXT_PUBLIC_FIREBASE_API_KEY=xxx,NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=vault-share-dev.firebaseapp.com,NEXT_PUBLIC_FIREBASE_PROJECT_ID=vault-share-dev,ALLOWED_EMAILS=admin@example.com,SESSION_SECRET=YOUR_SESSION_SECRET,GOOGLE_CLOUD_PROJECT=vault-share-dev"
```

`xxx` と `YOUR_SESSION_SECRET` は実際の値に置き換える。

**方法 B: コンソール**

1. [Cloud Run コンソール](https://console.cloud.google.com/run) を開く
2. サービス `vault-share-web` をクリック
3. **「編集と新しいリビジョンをデプロイ」** をクリック
4. **変数とシークレット** タブで、必要な環境変数を追加

**機密値（SESSION_SECRET）について**: Secret Manager の参照を使う場合は、先に Secret を作成し、`--set-secrets="SESSION_SECRET=vault-share-session-secret:latest"` のように指定する。詳細は [02-remaining-setup-and-manual-steps.md](../04-gcp-setup/02-remaining-setup-and-manual-steps.md) を参照。

---

## 3. デプロイの流れ

- **main への push**: ビルド → Artifact Registry に push → Cloud Run にデプロイ（本番トラフィック 100%）
- **PR の push**: プレビュー用リビジョンをデプロイ（タグ `pr-N`、トラフィック 0%）→ PR に URL をコメント

---

## 4. 実行済み GCP 設定（参考）

以下はすでにコマンドで実行済みです。再実行不要。

- Artifact Registry リポジトリ `vault-share`（asia-northeast1）
- Workload Identity プール `github-pool`、プロバイダ `github-provider`
- サービスアカウント `github-actions@vault-share-dev.iam.gserviceaccount.com`
- IAM ロール: `roles/run.admin`, `roles/artifactregistry.writer`, `roles/iam.serviceAccountUser`
- Workload Identity 紐づけ（`PheasantDevil/vault-share` のみ impersonate 可能）
