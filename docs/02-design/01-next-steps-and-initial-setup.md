# 今後の作業概要と初期設定の完了状況

## 1. 初期設定の完了状況

### 1.1 完了している項目

| 項目 | 内容 |
|------|------|
| **GitHub リポジトリ** | 作成済み（`PheasantDevil/vault-share`）、private、origin 設定済み |
| **GitHub 設定** | デフォルトブランチ `main`、説明文・トピック（typescript, nextjs, gcp, firestore, pulumi）設定済み |
| **ブランチ** | `main` / `feature/initial-setup` をリモートにプッシュ済み |
| **ローカル・モノレポ** | ルート package.json、pnpm workspace、apps/web（Next.js）、packages（api-client, db, crypto）、infra（Pulumi） |
| **CI** | `.github/workflows/ci.yml` で lint / format:check / build / test 実行 |
| **ドキュメント** | docs/01-research、02-design、03-github-setup（GitHub CLI コマンド一覧） |

### 1.2 未完了または手動が必要な項目（実装着手前の推奨）

以下のいずれかが未完了の場合、**認証・Firestore 利用・暗号化・1Password 連携などの実装着手は保留**することを推奨します。  
（UI のスケルトン追加や型の拡張のみ進めることは可能です。）

**GCP ログインとプロジェクト作成も初期設定に含め、このタイミングで構築しておくことを推奨します。**  
コマンド一覧は [docs/04-gcp-setup/01-gcloud-commands-and-initial-setup.md](../04-gcp-setup/01-gcloud-commands-and-initial-setup.md) に記載しています。Google Cloud CLI (gcloud) はローカルにインストール済みであればそのまま利用できます。

| 順番 | 項目 | 内容 | 実施方法 |
|------|------|------|----------|
| 1 | **GCP ログイン** | 利用する Google アカウントで gcloud にログインしていること | `gcloud auth login`（必要に応じて `gcloud auth application-default login`） |
| 2 | **GCP プロジェクト作成** | 本サービス用の GCP プロジェクトが存在し、課金が有効であること | `gcloud projects create <PROJECT_ID>` のあと、コンソールで課金アカウントをリンク |
| 3 | **Firestore** | Native モードのデータベースが 1 つ作成されていること | コンソールで Firestore 作成、または Pulumi 実行後にコンソールで DB 作成（Pulumi は API 有効化のみ） |
| 4 | **Identity Platform** | メール/パスワード・Google 等のプロバイダが有効であること | GCP コンソール「Identity Platform」でプロバイダ設定（Pulumi は API 有効化のみ） |
| 5 | **Secret Manager の鍵** | 項目暗号用の AES-256 鍵を Secret `vault-share-item-encryption-key` に登録していること | 先に Pulumi で Secret リソースを作成したうえで、コンソールまたは `gcloud` でバージョン（鍵値）を追加 |
| 6 | **Pulumi の初回実行** | `infra/` で `pulumi up` を実行し、API 有効化と Secret リソース作成が済んでいること | `infra/` で `pulumi config set gcp:project <PROJECT_ID>` のあと `pulumi up`（要 Pulumi ログイン・GCP 認証） |

**確認の目安**: GCP にログイン済みで、プロジェクト ID が決まり、Firestore と Identity Platform が利用可能で、アプリから参照する暗号鍵が Secret Manager に存在すれば、次の実装に進んで問題ありません。

---

## 2. この後の作業内容（概要）

初期設定が整ったあと、おおむね次の順で進める想定です。

### 2.1 認証まわり（R1, R2, R3）

- **Identity Platform 連携**: Next.js から Firebase Auth / Identity Platform SDK でメール・パスワード・Google ログインを実装。
- **セッション・ログアウト**: セッション Cookie または ID トークンの検証、ログアウト処理。
- **MFA**: Identity Platform の TOTP・SMS を有効化し、登録・検証フローを UI に組み込む。
- **パスワードリセット**: Identity Platform のパスワードリセットメールフローを利用。

### 2.2 グループ・招待（R6, R9）

- **Group CRUD**: Firestore にグループ・メンバーを書き、一覧・詳細・作成・更新・削除の API と画面。
- **招待**: 招待トークン発行・招待リンク・トークン検証による参加処理。

### 2.3 機密項目の登録・一覧・暗号化（R5, R7, R8）

- **Item CRUD**: 手動登録フォーム（タイトル・URL・ユーザー名・パスワード・メモ・カテゴリ）。一覧・詳細・編集・論理削除（R11）。
- **暗号化**: 保存前に `@vault-share/crypto` と Secret Manager の鍵で AES-256 暗号化。読み取り時に復号。
- **アクセス制御・監査**: グループメンバーのみアクセス可能にし、参照・作成・更新・削除の監査ログを記録。

### 2.4 1Password 連携（R4）

- **CSV/1PUX インポート**: アップロードしたファイルをパースし、項目として登録する API と UI。
- **エクスポート**: 当サービスから 1Password 形式（CSV 等）でエクスポートする API と UI。
- **1Password Connect**: Connect API で vault 一覧・アイテム取得し、選択したアイテムを当サービスに登録（無料枠 3 vault）。超過時は CSV インポートへ誘導。

### 2.5 その他（R10, R12）

- **カテゴリ/ラベル**: 項目の種別・フィルタ・検索（R10）。
- **レート制限・セキュリティヘッダ**: Next.js ミドルウェアや GCP でレート制限・ヘッダ付与（R12）。

### 2.6 インフラ・CI/CD の拡張

- **Cloud Run デプロイ**: コンテナビルド・プッシュ・Cloud Run デプロイを GitHub Actions に追加（OIDC で GCP 認証）。
- **環境分離**: dev / prod などスタックまたはブランチでデプロイ先を分離。

---

## 3. 着手の保留について

- **初期設定で未完了の項目がある場合**（上記 1.2 のいずれかが未実施の場合）は、**認証・DB・暗号化・1Password 連携の実装着手は保留**し、先に以下を完了させることを推奨します。
  - GCP ログイン（`gcloud auth login` 等）
  - GCP プロジェクトの作成と課金の有効化
  - Firestore の作成
  - Identity Platform のプロバイダ設定
  - Secret Manager への暗号鍵登録（および必要なら Pulumi の初回 `pulumi up`）
- 上記が完了している場合は、**2.1 認証まわり**から順に着手して問題ありません。
