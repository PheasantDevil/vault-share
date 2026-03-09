# CI/CD 設定：手動設定が必要な項目

GitHub Actions から Cloud Run にデプロイするため、以下の手動設定を行ってください。**GCP 側の OIDC・Artifact Registry・サービスアカウント等は既にコマンドで実行済み**です。

---

## 1. GitHub リポジトリ変数の設定（必須）

GitHub の **Settings** → **Secrets and variables** → **Actions** → **Variables** で、**New repository variable** を押し、以下 4 つを追加する。

| 変数名                       | 値                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------- |
| `GCP_PROJECT_ID`             | `vault-share-dev`                                                                                        |
| `GCP_REGION`                 | `asia-northeast1`                                                                                        |
| `WORKLOAD_IDENTITY_PROVIDER` | `projects/プロジェクト番号/locations/global/workloadIdentityPools/github-pool/providers/github-provider` |
| `SERVICE_ACCOUNT`            | `github-actions@vault-share-dev.iam.gserviceaccount.com`                                                 |

**重要**: `WORKLOAD_IDENTITY_PROVIDER` は `projects/` の後に**プロジェクト ID ではなくプロジェクト番号（数字）**を指定します。プロジェクト番号の取得コマンド:

```bash
gcloud projects describe vault-share-dev --format='value(projectNumber)'
```

例（vault-share-dev）: プロジェクト番号 `1013607433269` の場合 → `projects/1013607433269/locations/global/workloadIdentityPools/github-pool/providers/github-provider`

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

**方法 B: コンソールから設定**

1. [Cloud Run コンソール](https://console.cloud.google.com/run) を開く
2. プロジェクト **vault-share-dev** を選択し、サービス一覧から **vault-share-web** の**サービス名（リンク）**をクリックして、サービス詳細を開く
3. **編集ボタンを押して編集画面を開く**  
   サービス詳細画面の**画面上部**にある、次のいずれかのボタンをクリックする。
   - **「編集と新しいリビジョンをデプロイ」**（日本語）
   - **「Edit & deploy new revision」**（英語）
   - または **「編集」** / **「EDIT」**  
     見つからない場合は、画面上部のタブ（概要・リビジョン・ログなど）の右側、またはサービス名の右隣のボタン群を確認する。
4. 編集画面で **「コンテナ」** タブ（または **「Container」**）を開き、その中の **「変数とシークレット」**（**「Variables & Secrets」**）セクションを開く
5. **「変数を追加」**（**「Add Variable」**）で、以下の名前と値を 1 件ずつ追加する（値は `apps/web/.env.local` および固定値を参照）

| 名前                               | 値（例・参照元）                                                                         |
| ---------------------------------- | ---------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_FIREBASE_API_KEY`     | `.env.local` の同項目の値                                                                |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `vault-share-dev.firebaseapp.com`                                                        |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID`  | `vault-share-dev`                                                                        |
| `ALLOWED_EMAILS`                   | `.env.local` の同項目の値（例: `user1@example.com,user2@example.com,admin@example.com`） |
| `SESSION_SECRET`                   | `.env.local` の同項目の値（シングルクォートは含めない）                                  |
| `GOOGLE_CLOUD_PROJECT`             | `vault-share-dev`                                                                        |

6. 必要な変数をすべて追加したら、画面下部の **「デプロイ」** をクリックして新しいリビジョンをデプロイする

**機密値（SESSION_SECRET）について**: Secret Manager の参照を使う場合は、先に Secret を作成し、`--set-secrets="SESSION_SECRET=vault-share-session-secret:latest"` のように指定する。詳細は [02-remaining-setup-and-manual-steps.md](../04-gcp-setup/02-remaining-setup-and-manual-steps.md) を参照。

**Firebase の `NEXT_PUBLIC_*` 変数**: 本アプリは `/api/config` からランタイムで読み込むため、Cloud Run の環境変数に設定すればビルドし直さずに反映されます。

---

## 2.1 Firebase の承認済みドメイン（必須）

Cloud Run の URL でログイン・サインアップするには、**Firebase の承認済みドメイン**に Cloud Run のドメインを追加する必要があります。未追加だと「入力内容を確認してください」や `auth/unauthorized-domain` が発生します。

**手順**:

1. [Firebase コンソール](https://console.firebase.google.com/) でプロジェクト **vault-share-dev** を開く
2. 左メニュー **ビルド** → **Authentication** → **設定**（または **Sign-in method** の横の歯車）→ **承認済みドメイン**
3. **ドメインを追加** をクリックし、Cloud Run のドメインを入力する
   - 例: `vault-share-web-1013607433269.asia-northeast1.run.app`
   - 実際の値は Cloud Run のサービス URL を参照（`gcloud run services describe vault-share-web --region=asia-northeast1 --project=vault-share-dev --format='value(status.url)'` でホスト部分のみ）

---

## 3. デプロイの流れ

- **main への push**: ビルド → Artifact Registry に push → Cloud Run にデプロイ（本番トラフィック 100%）
- **PR の push**: プレビュー用リビジョンをデプロイ（タグ `pr-N`、トラフィック 0%）→ PR に URL をコメント

---

## 4. 事前に有効化が必要な API

Workload Identity Federation 利用には **IAM Service Account Credentials API** の有効化が必要です:

```bash
gcloud services enable iamcredentials.googleapis.com --project=vault-share-dev
```

## 5. 実行済み GCP 設定（参考）

以下はすでにコマンドで実行済みです。再実行不要。

- Artifact Registry リポジトリ `vault-share`（asia-northeast1）
- Workload Identity プール `github-pool`、プロバイダ `github-provider`
- サービスアカウント `github-actions@vault-share-dev.iam.gserviceaccount.com`
- IAM ロール: `roles/run.admin`, `roles/artifactregistry.writer`, `roles/iam.serviceAccountUser`
- Workload Identity 紐づけ（`PheasantDevil/vault-share` のみ impersonate 可能）

---

## 6. 承認済みドメイン・環境変数設定後の作業概要

「承認済みドメイン」と「Cloud Run の環境変数」を済ませてデプロイしたあとに行う作業の流れです。

| 順番 | 作業                         | 内容                                                                                                                                                                                                                                                                      |
| ---- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | **動作確認**                 | 本番 URL でサインアップ・ログインができるか確認する（ALLOWED_EMAILS に含まれるメールで）。                                                                                                                                                                                |
| 2    | **SESSION_SECRET の確認**    | 環境変数で `SESSION_SECRET` を直接設定した場合、値が「実際の秘密文字列」になっているか確認する。`--set-secrets=...` のような gcloud のオプション文字列がそのまま値に入っていないこと。Secret Manager を使う場合はコンソールの「シークレットを追加」でリソースを指定する。 |
| 3    | **（任意）カスタムドメイン** | 必要なら Cloud Run にカスタムドメインをマッピングし、Firebase の承認済みドメインにそのドメインを追加する。                                                                                                                                                                |
| 4    | **（任意）監視・アラート**   | Cloud Monitoring でアラートやダッシュボードを設定する。                                                                                                                                                                                                                   |

---

## 7. 確認コマンドと作業ログ（実行例）

以下はコマンドで実行可能な確認です。実施した日時・結果を記録する場合はこのセクションを更新してください。

**サービス URL の取得**

```bash
gcloud run services describe vault-share-web \
  --region=asia-northeast1 \
  --project=vault-share-dev \
  --format='value(status.url)'
```

**環境変数が設定されているかの確認**（変数名のみ。値はコンソールで確認）

```bash
gcloud run services describe vault-share-web \
  --region=asia-northeast1 \
  --project=vault-share-dev \
  --format='yaml(spec.template.spec.containers[0].env)'
```

**アプリの応答確認**

```bash
# トップページ（200 なら OK）
curl -s -o /dev/null -w "%{http_code}\n" "$(gcloud run services describe vault-share-web --region=asia-northeast1 --project=vault-share-dev --format='value(status.url)')/"

# Firebase 設定のランタイム取得（最新デプロイで JSON が返る）
curl -s "$(gcloud run services describe vault-share-web --region=asia-northeast1 --project=vault-share-dev --format='value(status.url)')/api/config"
```

**実行ログ（記録用）**

| 日付       | 実行内容          | 結果                                                                                                               |
| ---------- | ----------------- | ------------------------------------------------------------------------------------------------------------------ |
| 2026-03-09 | サービス URL 取得 | `https://vault-share-web-qat52jyzfa-an.a.run.app`                                                                  |
| 2026-03-09 | 環境変数確認      | NODE*ENV, NEXT_PUBLIC_FIREBASE*\*, ALLOWED_EMAILS, SESSION_SECRET, GOOGLE_CLOUD_PROJECT が設定されていることを確認 |
| 2026-03-09 | トップページ curl | HTTP 200                                                                                                           |
| 2026-03-09 | リビジョン一覧    | vault-share-web-00007-rth (True), 00006, 00005                                                                     |
