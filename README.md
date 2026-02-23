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

- **無料枠（1 プロジェクトあたり、太平洋時間 0 時リセット）**
  - 保存データ: 1 GiB
  - ドキュメント読み取り: 50,000 回/日
  - ドキュメント書き込み: 20,000 回/日
  - ドキュメント削除: 20,000 回/日
  - 送信データ: 10 GiB/月

- **どの程度でコストがかかり始めるか**  
  上記のいずれかを 1 日（または 1 月の送信）で超えると、課金対象になります。課金を有効にしていない場合は、超過後に利用が止まる場合があります。

- **超過時の追加コストの目安（リージョンにより変動）**
  - 読み取り: 約 $0.03 / 10 万ドキュメント
  - 書き込み: 約 $0.09 / 10 万ドキュメント
  - 削除: 約 $0.01 / 10 万ドキュメント  
    少人数チームで 1 日 5 万読・2 万書程度までなら無料枠内です。それを超える利用が続く場合に、上記程度の追加費用を見込んでください。最新の料金は [Firestore の料金](https://cloud.google.com/firestore/pricing) を参照してください。

## 開発

```bash
pnpm install
pnpm dev          # Next.js (apps/web) を起動
pnpm build        # 全パッケージビルド
pnpm lint         # 全パッケージ lint（CI では CI=true で next lint が非対話で実行）
pnpm run format:check
pnpm test
```

環境変数（ローカル・Pulumi 用）: `GCP_PROJECT_ID`、Firestore 用の `GOOGLE_APPLICATION_CREDENTIALS`、暗号鍵用の Secret Manager 参照などを必要に応じて設定。リポジトリには `.env.example` を配置予定（未コミットの場合は README を参照）。

## ドキュメント

- `docs/01-research/`: 設計前調査（フレームワーク・IaC・リポジトリ・認証・1Password・暗号化）
- `docs/02-design/`: アーキテクチャ・要件・コンポーネント・データ設計

## リポジトリ構成

```
├── apps/
│   ├── web/           # Next.js
│   └── extension/     # 将来: Chrome 拡張（現状は README のみ）
├── packages/
│   ├── api-client/   # 共有型・DTO
│   ├── db/           # Firestore クライアント
│   └── crypto/       # 暗号化ロジック
├── infra/             # Pulumi（GCP）
└── .github/workflows/ # CI
```

## ローカル格納場所

リポジトリのクローンは `/Users/Work/vault-share/` を想定しています。

## マージ手順（PR）

作業は `feature/*` ブランチで行い、main へのマージは Pull Request で行う想定です。

1. GitHub にリポジトリを作成し、`git remote add origin <URL>` でリモートを追加
2. `git push -u origin feature/initial-setup` でブランチをプッシュ
3. GitHub 上で `feature/initial-setup` から `main` への Pull Request を作成
4. CI（lint / format check / build / test）が通ることを確認してマージ
