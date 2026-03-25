# Cloud Run で「1Passwordからインポート」を有効にする

本番（Cloud Run）の Next.js は **`localhost` の Connect には接続できません**。  
**当面の標準構成**は、GCP 上の VM で Connect を動かし、**`http://<外部IP>:8080`** を `ONEPASSWORD_CONNECT_URL` に設定する（**追加のドメイン料金なし**）。  
ドメインを取得して **HTTPS** にしたくなったときは [07-onepassword-connect-caddy-https.md](./07-onepassword-connect-caddy-https.md) を参照する。

## 自動化されていること（リポジトリ／CI）

- **GitHub Actions**（`deploy.yml`）: **`ONEPASSWORD_CONNECT_URL`**（**Actions Secret 優先**、なければ Variable）が**空でない**ときだけ、次を Cloud Run に設定する。
  - 環境変数 `ONEPASSWORD_CONNECT_URL`（その値）
  - Secret Manager の **`vault-share-onepassword-connect-token`** を環境変数 **`ONEPASSWORD_CONNECT_TOKEN`** としてマウント
- **スクリプト** `scripts/gcp/setup-onepassword-connect-secret.sh`: 上記シークレットの作成（初回）と、GitHub Actions SA / Cloud Run デフォルト SA への `secretAccessor` 付与

## 手順の流れ

### 1. Connect を Cloud Run から届く場所で動かす

**ゼロから GCE に載せる場合（推奨スクリプト）:**

```bash
export GCP_PROJECT_ID=vault-share-dev
pnpm run gcp:provision-connect-vm
pnpm run gcp:install-connect-vm -- /path/to/1password-credentials.json
```

手動でも可: GCE VM ＋ Docker Compose（`infra/1password-connect` と同型）。  
VM の外部 IP は次で確認できる:

```bash
gcloud compute instances describe onepassword-connect \
  --zone=asia-northeast1-a \
  --project=vault-share-dev \
  --format='get(networkInterfaces[0].accessConfigs[0].natIP)'
```

ファイアウォールで **tcp:8080** が VM に届くこと。既存メモ: [06-gce-onepassword-connect-vm.md](./06-gce-onepassword-connect-vm.md)

公式: [Get started with a 1Password Connect server](https://developer.1password.com/docs/connect/get-started/)

### 2. Connect のベース URL（当面）

**`http://<上記IP>:8080`**（末尾スラッシュなし。アプリが `/v1/vaults` 等を付与）

- 通信は **平文 HTTP** のため、本番ポリシーで問題なければこのまま利用可能。
- **HTTPS + 独自ドメイン**にする場合はドメイン年額が発生する → [07-onepassword-connect-caddy-https.md](./07-onepassword-connect-caddy-https.md)

### 3. Secret Manager にトークンを登録（コマンド可）

1Password で **Connect 用アクセストークン**を発行したうえで、プロジェクトルートで:

```bash
export GCP_PROJECT_ID=vault-share-dev   # 実プロジェクトに合わせる
export OP_CONNECT_TOKEN='（1Password が発行したトークン）'
chmod +x scripts/gcp/setup-onepassword-connect-secret.sh
./scripts/gcp/setup-onepassword-connect-secret.sh
```

既にシークレットがある場合は IAM のみ更新される。トークンだけ差し替える場合:

```bash
echo -n 'NEW_TOKEN' | gcloud secrets versions add vault-share-onepassword-connect-token \
  --data-file=- \
  --project="$GCP_PROJECT_ID"
```

### 4. GitHub に URL を登録（手動）

**Settings → Secrets and variables → Actions**

- **Secret（推奨）** または **Variable** 名: **`ONEPASSWORD_CONNECT_URL`**
- 値: **`http://<外部IP>:8080`**（HTTPS に移行後は `https://...` に更新）

**未設定または空**のときは、CI は 1Password 用の Secret 参照を付けない（既存の `SESSION_SECRET` のみ）。

### 5. main のデプロイ

`main` に push されると通常どおりデプロイが走り、設定されていれば Cloud Run に `ONEPASSWORD_CONNECT_URL` / `ONEPASSWORD_CONNECT_TOKEN` が載る。

### 6. 動作確認（手動）

本番 URL にログイン → グループ詳細 → **1Passwordからインポート** → Vault 一覧が表示されるか。

## 権限・トラブルシュート

- **デプロイが Secret 参照で失敗する**: `github-actions@...` と Cloud Run の実行 SA に `roles/secretmanager.secretAccessor` が付いているか。スクリプトを再実行するか、[Secret Manager 手順](./04-secret-manager-setup.md) を参照。
- **Vault 一覧が空・500**: Connect の URL が Cloud Run の**外向き通信**から到達可能か、ファイアウォール・VPC の経路を確認。
- **カスタム Cloud Run サービスアカウント**を使っている場合: その SA にも `vault-share-onepassword-connect-token` への `secretAccessor` を付与する。

## 関連

- GCE VM メモ: [06-gce-onepassword-connect-vm.md](./06-gce-onepassword-connect-vm.md)
- HTTPS（Caddy・ドメイン取得後）: [07-onepassword-connect-caddy-https.md](./07-onepassword-connect-caddy-https.md)
- ローカル開発: `infra/1password-connect/README.md`
- CI 全体: [03-cicd-setup-gcp-and-github.md](./03-cicd-setup-gcp-and-github.md)
