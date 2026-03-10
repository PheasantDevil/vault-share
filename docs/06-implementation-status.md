# 実装状況ログ

最終更新: 2024年（実装状況確認時点）
最終実装: 2024年（監査ログ・カテゴリフィルタ実装完了）

## 概要

Vault Share プロジェクトの実装状況を記録します。設計ドキュメント（`docs/02-design/`）に基づき、要件ごとに実装状況を整理しています。

---

## 実装済み機能

### ✅ Aフェーズ: 認証まわり（R1, R3の一部）

| 項目 | 実装状況 | 備考 |
|------|---------|------|
| **Firebase クライアント/Admin 初期化** | ✅ 完了 | `apps/web/src/lib/firebase/` |
| **許可リストチェック** | ✅ 完了 | 環境変数 `ALLOWED_EMAILS` で管理 |
| **セッション発行 API** | ✅ 完了 | `apps/web/src/app/api/auth/session/route.ts` |
| **ログイン画面** | ✅ 完了 | `apps/web/src/app/login/page.tsx` |
| **新規登録画面** | ✅ 完了 | `apps/web/src/app/signup/page.tsx` |
| **ログアウト** | ✅ 完了 | `apps/web/src/app/api/auth/logout/route.ts` |
| **AuthGuard / ミドルウェア** | ✅ 完了 | `apps/web/src/middleware.ts`（`/dashboard` 保護） |
| **User 作成/更新** | ✅ 完了 | ログイン時に Firestore に User ドキュメント作成/更新 |

**実装ファイル:**
- `apps/web/src/lib/firebase/client.ts` - Firebase クライアント初期化
- `apps/web/src/lib/firebase/admin.ts` - Firebase Admin 初期化
- `apps/web/src/lib/auth/allowed-emails.ts` - 許可リストチェック
- `apps/web/src/lib/auth/session.ts` - セッション管理（JWT）
- `apps/web/src/lib/auth/get-session.ts` - セッション取得
- `apps/web/src/app/api/auth/session/route.ts` - セッション発行 API
- `apps/web/src/app/api/auth/logout/route.ts` - ログアウト API
- `apps/web/src/app/login/page.tsx` - ログインページ
- `apps/web/src/app/signup/page.tsx` - サインアップページ
- `apps/web/src/middleware.ts` - 認証ミドルウェア

---

### ✅ Bフェーズ: グループ・招待（R6, R9）

| 項目 | 実装状況 | 備考 |
|------|---------|------|
| **Group CRUD API** | ✅ 完了 | `apps/web/src/app/api/groups/route.ts` |
| **グループ詳細 API** | ✅ 完了 | `apps/web/src/app/api/groups/[id]/route.ts` |
| **メンバー一覧 API** | ✅ 完了 | `apps/web/src/app/api/groups/[id]/members/route.ts` |
| **招待発行 API** | ✅ 完了 | `apps/web/src/app/api/groups/[id]/invitations/route.ts` |
| **招待参加 API** | ✅ 完了 | `apps/web/src/app/api/invitations/accept/route.ts` |
| **ダッシュボード** | ✅ 完了 | `apps/web/src/app/dashboard/page.tsx` |
| **グループ一覧** | ✅ 完了 | `apps/web/src/components/GroupList.tsx` |
| **グループ作成** | ✅ 完了 | `apps/web/src/app/dashboard/groups/new/page.tsx` |
| **グループ詳細・編集・削除** | ✅ 完了 | `apps/web/src/app/dashboard/groups/[id]/page.tsx` |
| **招待ページ** | ✅ 完了 | `apps/web/src/app/invite/page.tsx` |

**実装ファイル:**
- `apps/web/src/app/api/groups/route.ts` - グループ一覧・作成
- `apps/web/src/app/api/groups/[id]/route.ts` - グループ詳細・更新・削除
- `apps/web/src/app/api/groups/[id]/members/route.ts` - メンバー一覧
- `apps/web/src/app/api/groups/[id]/invitations/route.ts` - 招待発行
- `apps/web/src/app/api/invitations/accept/route.ts` - 招待参加
- `apps/web/src/app/dashboard/page.tsx` - ダッシュボード
- `apps/web/src/app/dashboard/groups/[id]/page.tsx` - グループ詳細ページ
- `apps/web/src/app/dashboard/groups/new/page.tsx` - グループ作成ページ
- `apps/web/src/app/invite/page.tsx` - 招待ページ
- `apps/web/src/components/GroupList.tsx` - グループ一覧コンポーネント

---

### ✅ 機密項目の登録・一覧・暗号化（R5, R7, R8）

| 項目 | 実装状況 | 備考 |
|------|---------|------|
| **Item CRUD API** | ✅ 完了 | 作成・取得・更新・削除 |
| **暗号化/復号** | ✅ 完了 | AES-256（`@vault-share/crypto`） |
| **アクセス制御** | ✅ 完了 | グループメンバーのみアクセス可能 |
| **論理削除** | ✅ 完了 | `deletedAt` フィールドで管理 |
| **Item 作成フォーム** | ✅ 完了 | グループ詳細ページ内 |
| **監査ログ** | ✅ 完了 | アイテム作成・更新・削除時に記録 |
| **カテゴリフィルタ** | ✅ 完了 | グループ詳細ページにフィルタ UI 追加 |

**実装ファイル:**
- `apps/web/src/app/api/groups/[id]/items/route.ts` - アイテム一覧・作成
- `apps/web/src/app/api/groups/[id]/items/[itemId]/route.ts` - アイテム詳細・更新・削除
- `apps/web/src/lib/items/encryption.ts` - 暗号化/復号ロジック
- `apps/web/src/lib/items/types.ts` - Item 型定義
- `packages/crypto/src/index.ts` - 暗号化ライブラリ
- `packages/db/src/schema.ts` - ItemDoc スキーマ定義

**データ構造:**
- `ItemPayload`: 平文データ（title, type, value, note）
- `ItemDoc`: Firestore 保存用（ciphertext, iv, メタデータ）

---

## 部分的に実装済み

該当なし（すべて完了しました）

---

## 未実装機能

### ❌ MFA（R2）

| 項目 | 実装状況 | 備考 |
|------|---------|------|
| **TOTP MFA** | ❌ 未実装 | Identity Platform の TOTP 連携 |
| **SMS MFA** | ❌ 未実装 | Identity Platform の SMS 連携 |
| **MFA 設定画面** | ❌ 未実装 | ユーザー設定ページ |

**必要な作業:**
- Identity Platform で MFA を有効化（コンソール設定）
- MFA 登録・検証の UI 実装
- ログイン時に MFA チェックを追加
- 設定画面の実装

**参考ドキュメント:**
- `docs/01-research/04-identity-platform-free-tier-mfa.md`

---

### ❌ パスワードリセット（R3の一部）

| 項目 | 実装状況 | 備考 |
|------|---------|------|
| **パスワードリセット** | ❌ 未実装 | Identity Platform のパスワードリセットメール |

**必要な作業:**
- Identity Platform のパスワードリセットメール機能を利用
- パスワードリセットページの実装
- パスワードリセットリクエスト API の実装

---

### ❌ 1Password 連携（R4）

| 項目 | 実装状況 | 備考 |
|------|---------|------|
| **CSV インポート** | ❌ 未実装 | 1Password CSV のパース・登録 |
| **1PUX インポート** | ❌ 未実装 | 1Password 1PUX のパース・登録 |
| **CSV エクスポート** | ❌ 未実装 | 当サービスから 1Password CSV 形式でエクスポート |
| **1Password Connect** | ❌ 未実装 | Connect API で vault 参照・アイテム登録 |

**必要な作業:**
- CSV/1PUX パーサーの実装
- インポート API と UI の実装
- エクスポート API と UI の実装
- 1Password Connect サーバーのセットアップ（必要に応じて）
- Connect API 連携の実装

**参考ドキュメント:**
- `docs/01-research/05-1password-connect-pricing.md`

---

### ❌ レート制限・セキュリティヘッダ（R12）

| 項目 | 実装状況 | 備考 |
|------|---------|------|
| **レート制限** | ❌ 未実装 | Next.js ミドルウェアまたは GCP で実装 |
| **セキュリティヘッダ** | ❌ 未実装 | CSP, HSTS 等のヘッダ設定 |

**必要な作業:**
- Next.js ミドルウェアでレート制限を実装
- セキュリティヘッダの設定（`next.config.js` またはミドルウェア）

---

## インフラ・CI/CD

### ✅ 基本インフラ

| 項目 | 実装状況 | 備考 |
|------|---------|------|
| **Pulumi IaC** | ✅ 実装済み | `infra/index.ts` |
| **Secret Manager** | ✅ 設定済み | `vault-share-item-encryption-key` |
| **Firestore** | ✅ 作成済み | Native モード（asia-northeast1） |
| **Identity Platform** | ✅ 設定済み | メール/パスワードのみ有効 |

### ⚠️ CI/CD

| 項目 | 実装状況 | 備考 |
|------|---------|------|
| **GitHub Actions（lint/test/build）** | ✅ 実装済み | `.github/workflows/ci.yml` |
| **Cloud Run デプロイ** | ❌ 未実装 | GitHub Actions での自動デプロイ |

**必要な作業:**
- Cloud Run へのデプロイワークフローの追加
- OIDC での GCP 認証設定
- 環境分離（dev/prod）の設定

**参考ドキュメント:**
- `docs/05-deployment/03-cicd-setup-gcp-and-github.md`

---

## データベーススキーマ

### ✅ 実装済みスキーマ

- `users` - ユーザー情報（`UserDoc`）
- `groups` - グループ情報（`GroupDoc`）
- `groupMembers` - グループメンバー（`GroupMemberDoc`）
- `invitations` - 招待情報（`InvitationDoc`）
- `items` - 機密項目（`ItemDoc`）
- `auditLogs` - 監査ログ（`AuditLogDoc`）

**定義場所:** `packages/db/src/schema.ts`

---

## 次のステップ（優先度順）

### 高優先度

1. **MFA の実装**
   - Identity Platform で MFA を有効化
   - MFA 登録・検証 UI の実装

2. **パスワードリセットの実装**
   - Identity Platform のパスワードリセットメール機能を利用

### 中優先度

3. **1Password 連携（CSV インポート/エクスポート）**
   - CSV パーサーの実装
   - インポート/エクスポート API と UI

4. **検索機能の追加**
   - アイテム一覧でのタイトル検索機能

### 低優先度

6. **レート制限・セキュリティヘッダ**
   - ミドルウェアでのレート制限
   - セキュリティヘッダの設定

7. **Cloud Run デプロイの自動化**
   - GitHub Actions でのデプロイワークフロー

8. **1Password Connect 連携**
   - Connect API の実装（無料枠 3 vault）

---

## 補足

- 実装状況の確認は、コードベース検索とファイル読み取りで実施
- 各機能の詳細は設計ドキュメント（`docs/02-design/`）を参照
- 初期設定の完了状況は `docs/02-design/01-next-steps-and-initial-setup.md` を参照
