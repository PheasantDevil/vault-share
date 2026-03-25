# Cloud Run で「1Passwordからインポート」を有効にする

本番（Cloud Run）の Next.js は **`localhost` の Connect に接続できません**。  
Connect を **HTTPS で到達可能な URL** で公開し、トークンを **Secret Manager** に置いたうえで、デプロイで環境変数を注入します。

## 自動化されていること（リポジトリ／CI）

- **GitHub Actions**（`deploy.yml`）: リポジトリ変数 **`ONEPASSWORD_CONNECT_URL`** が**空でない**ときだけ、次を Cloud Run に設定する。
  - 環境変数 `ONEPASSWORD_CONNECT_URL`（その値）
  - Secret Manager の **`vault-share-onepassword-connect-token`** を環境変数 **`ONEPASSWORD_CONNECT_TOKEN`** としてマウント
- **スクリプト** `scripts/gcp/setup-onepassword-connect-secret.sh`: 上記シークレットの作成（初回）と、GitHub Actions SA / Cloud Run デフォルト SA への `secretAccessor` 付与

## 手順の流れ

### 1. Connect サーバーをデプロイする（手動・インフラ）

Cloud Run から **TLS（HTTPS）** で届く場所に 1Password Connect（`connect-api` + `connect-sync`）を置く。例:

- GCP の VM / GKE / 別 Cloud Run サービス
- 既存の社内公開エンドポイント

ローカル PC の `http://localhost:8080` のみでは不十分。

公式: [Get started with a 1Password Connect server](https://developer.1password.com/docs/connect/get-started/)

### 2. Connect のベース URL を決める

例: `https://connect.example.com`（パスなし。アプリが `/v1/vaults` 等を付与）

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

### 4. GitHub にリポジトリ変数を追加（手動）

**Settings → Secrets and variables → Actions → Variables**

| Name                      | Value                                          |
| ------------------------- | ---------------------------------------------- |
| `ONEPASSWORD_CONNECT_URL` | `https://connect.example.com`（手順 2 の URL） |

**未設定または空**のときは、CI は 1Password 用の Secret 参照を付けない（既存の `SESSION_SECRET` のみ）。

### 5. main へマージ後のデプロイ

`main` に push されると通常どおりデプロイが走り、変数が設定されていれば Cloud Run に `ONEPASSWORD_CONNECT_URL` / `ONEPASSWORD_CONNECT_TOKEN` が載る。

### 6. 動作確認（手動）

本番 URL にログイン → グループ詳細 → **1Passwordからインポート** → Vault 一覧が表示されるか。

## 権限・トラブルシュート

- **デプロイが Secret 参照で失敗する**: `github-actions@...` と Cloud Run の実行 SA に `roles/secretmanager.secretAccessor` が付いているか。スクリプトを再実行するか、[Secret Manager 手順](./04-secret-manager-setup.md) を参照。
- **Vault 一覧が空・500**: Connect の URL が Cloud Run の**外向き通信**から到達可能か、ファイアウォール・VPC の経路を確認。
- **カスタム Cloud Run サービスアカウント**を使っている場合: その SA にも `vault-share-onepassword-connect-token` への `secretAccessor` を付与する。

## 関連

- ローカル開発: `infra/1password-connect/README.md`
- CI 全体: [03-cicd-setup-gcp-and-github.md](./03-cicd-setup-gcp-and-github.md)
