# Vault Share

親しい間柄（家族・少人数チーム）で、機密情報（ログインID・パスワード、銀行情報の参照用ログインなど）を安全に共有するための Web サービスです。

## 主な機能（予定）

- **認証**: Google Cloud Identity Platform（メール/パスワード・ソーシャルログイン・MFA）
- **ログイン・セッション**: ログイン/ログアウト、パスワードリセット
- **1Password 連携**: 1Password Connect（無料枠 3 vault）で vault 参照・アイテム登録。無料枠超過時は CSV インポートに切り替え。常に CSV/1PUX のインポート・エクスポートも利用可能
- **データ登録**: 手動登録。グループ単位での共有
- **招待・メンバー管理**: グループへの招待、メンバー追加/削除

## 技術スタック

- フロント・バック: TypeScript（Next.js）
- 認証: Google Cloud Identity Platform
- インフラ: GCP（Cloud Run, **Firestore**, Secret Manager）、Pulumi（TypeScript）で IaC
- CI/CD: GitHub Actions

## Chrome 拡張機能について

**現時点では Chrome 拡張機能は未実装です。**  
初期リリースでは、1Password のエクスポート（CSV 等）を当サービスに取り込む方式で対応します。  
**機能強化時に、当サービス用の Chrome 拡張機能を開発する予定です。** 拡張では、1Password との連携をしやすい UI（例: エクスポートデータの取り込み支援）を提供することを想定しています。リポジトリの構成や API は、その拡張開発を見据えた下地として整えています（`apps/extension/` を予定地としています）。

## Firestore 無料枠とコストの目安

データストアに **Firestore** を使用します。無料枠を超えると課金が発生します。

- **無料枠（1 プロジェクトあたり、太平洋時間 0 時リセット）**: 保存 1 GiB、読み取り 5万/日、書き込み 2万/日、削除 2万/日、送信 10 GiB/月
- **超過時**: 読み取り 約 $0.03/10万ドキュメント、書き込み 約 $0.09/10万 等。詳細は [Firestore の料金](https://cloud.google.com/firestore/pricing) を参照。

---

## 開発環境構築手順

作業者は任意のディレクトリにリポジトリをクローンして構築します。

### 1. 必要なツール

- Node.js 20+
- [pnpm](https://pnpm.io/)
- git
- [GitHub CLI (gh)](https://cli.github.com/)
- [Google Cloud CLI (gcloud)](https://cloud.google.com/sdk/docs/install)

### 2. リポジトリのクローン

```bash
git clone https://github.com/<OWNER>/vault-share.git
cd vault-share
```

（`<OWNER>` は組織またはユーザー名。すでに fork している場合はその URL を指定。）

### 3. GitHub CLI と gcloud CLI の認証・初期設定

開発環境構築時に、以下を**リポジトリルート**で実行します。

**GitHub CLI（リポジトリへの push / PR に必要）**

```bash
gh auth login
gh auth status   # 認証確認
```

既存リポジトリを新規作成して紐づける場合のみ:

```bash
gh repo create vault-share --private --source=. --remote=origin --description "機密情報を親しい間柄で安全に共有する Web サービス"
git push -u origin main
```

**Google Cloud CLI（GCP 利用に必要）**

```bash
# 認証（ブラウザが開く）
gcloud auth login
gcloud auth application-default login   # ローカルアプリ・Pulumi 用

# プロジェクトが未作成の場合のみ: 作成してデフォルトに設定
gcloud projects create <PROJECT_ID> --name="vault-share"
gcloud config set project <PROJECT_ID>

# 利用する API の有効化（プロジェクトで課金リンク済みであること）
gcloud services enable firestore.googleapis.com --project=<PROJECT_ID>
gcloud services enable identitytoolkit.googleapis.com --project=<PROJECT_ID>
gcloud services enable secretmanager.googleapis.com --project=<PROJECT_ID>
```

- `<PROJECT_ID>` は小文字・数字・ハイフンのみでグローバル一意（例: `vault-share-dev`）。
- 課金の紐づけは [Google Cloud コンソール](https://console.cloud.google.com/) で行います（「お支払い」→「アカウントをリンク」）。
- **コマンド一覧・実行記録の詳細**: [GitHub](docs/03-github-setup/01-github-cli-commands.md) / [GCP](docs/04-gcp-setup/01-gcloud-commands-and-initial-setup.md)

### 4. 依存関係のインストールと起動

```bash
pnpm install
pnpm dev          # Next.js (apps/web) を起動
```

その他: `pnpm build`（ビルド）、`pnpm lint`、`pnpm run format:check`、`pnpm test`。  
環境変数（`GCP_PROJECT_ID`、`GOOGLE_APPLICATION_CREDENTIALS`、Secret Manager 参照など）は必要に応じて設定（`.env.example` を参照）。

---

## 開発

```bash
pnpm dev
pnpm build
pnpm lint
pnpm run format:check
pnpm test
```

## 今後の作業と初期設定

**この後の作業内容の概要**と、**初期設定で完了していない項目**は [docs/02-design/01-next-steps-and-initial-setup.md](docs/02-design/01-next-steps-and-initial-setup.md) で確認できます。未完了項目がある場合は、認証・DB・暗号化などの実装着手は保留することを推奨します。

## ドキュメント

- `docs/01-research/`: 設計前調査
- `docs/02-design/`: アーキテクチャ・要件・**今後の作業概要と初期設定**
- `docs/03-github-setup/`: GitHub CLI コマンド一覧
- `docs/04-gcp-setup/`: GCP 初期設定・gcloud コマンド一覧・実行したコマンドの記録

## リポジトリ構成

```
├── apps/web/           # Next.js
├── apps/extension/     # 将来: Chrome 拡張（現状は README のみ）
├── packages/api-client/
├── packages/db/
├── packages/crypto/
├── infra/               # Pulumi（GCP）
└── .github/workflows/   # CI
```

## マージ手順（PR）

1. 作業ブランチをプッシュ: `git push -u origin feature/<名前>`
2. PR 作成: `gh pr create --base main --title "タイトル" --body "説明"`
3. CI 通過後マージ: `gh pr merge <番号>`

詳細は [GitHub CLI コマンド一覧](docs/03-github-setup/01-github-cli-commands.md) を参照。
