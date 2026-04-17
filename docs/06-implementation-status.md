# 実装状況ログ

最終更新: 2026年3月（設計優先度に沿った実装状況の再整理）
最終実装: 2026年3月（MFA ログイン・1Password インポート等を反映）

## 概要

Vault Share プロジェクトの実装状況を記録します。設計ドキュメント（`docs/02-design/`）に基づき、要件ごとに実装状況を整理しています。

---

## 実装済み機能

### ✅ Aフェーズ: 認証まわり（R1, R3の一部）

| 項目                                   | 実装状況 | 備考                                                                                   |
| -------------------------------------- | -------- | -------------------------------------------------------------------------------------- |
| **Firebase クライアント/Admin 初期化** | ✅ 完了  | `apps/web/src/lib/firebase/`                                                           |
| **ログイン拒否（ブラックリスト）**     | ✅ 完了  | Firestore `blockedUsers`、管理 API は `ADMIN_EMAILS`                                   |
| **セッション発行 API**                 | ✅ 完了  | `apps/web/src/app/api/auth/session/route.ts`                                           |
| **ログイン画面**                       | ✅ 完了  | `apps/web/src/app/login/page.tsx`                                                      |
| **新規登録画面**                       | ✅ 完了  | `apps/web/src/app/signup/page.tsx`                                                     |
| **ログアウト**                         | ✅ 完了  | `apps/web/src/app/api/auth/logout/route.ts`                                            |
| **AuthGuard / ミドルウェア**           | ✅ 完了  | `apps/web/src/middleware.ts`（`/dashboard` 保護・アイドル 30 分）                      |
| **User 作成/更新**                     | ✅ 完了  | ログイン時に Firestore に User ドキュメント作成/更新                                   |
| **MFA（ログイン・設定）**              | ✅ 完了  | `/login/mfa`、`/dashboard/settings`（TOTP / SMS）、セッション API で `mfaEnabled` 同期 |
| **パスワードリセット**                 | ✅ 完了  | `sendPasswordResetEmail`、確認ページ、`/api/auth/reset-password`（IP レート制限）      |

**実装ファイル:**

- `apps/web/src/lib/firebase/client.ts` - Firebase クライアント初期化
- `apps/web/src/lib/firebase/admin.ts` - Firebase Admin 初期化
- `apps/web/src/lib/auth/blocked-users.ts` - ブロックリスト検査
- `apps/web/src/app/api/admin/blocked-users/route.ts` - ブロックリスト管理 API
- `apps/web/src/lib/auth/session.ts` - セッション管理（JWT）
- `apps/web/src/lib/auth/get-session.ts` - セッション取得
- `apps/web/src/app/api/auth/session/route.ts` - セッション発行 API
- `apps/web/src/app/api/auth/logout/route.ts` - ログアウト API
- `apps/web/src/app/login/page.tsx` - ログインページ
- `apps/web/src/app/signup/page.tsx` - サインアップページ
- `apps/web/src/middleware.ts` - 認証ミドルウェア
- `apps/web/src/app/login/mfa/page.tsx` - MFA 検証（ログイン続行）
- `apps/web/src/app/dashboard/settings/page.tsx` - MFA 登録・状態表示
- `apps/web/src/app/reset-password/page.tsx` / `confirm/page.tsx` - パスワードリセット UI

---

### ✅ Bフェーズ: グループ・招待（R6, R9）

| 項目                         | 実装状況 | 備考                                                    |
| ---------------------------- | -------- | ------------------------------------------------------- |
| **Group CRUD API**           | ✅ 完了  | `apps/web/src/app/api/groups/route.ts`                  |
| **グループ詳細 API**         | ✅ 完了  | `apps/web/src/app/api/groups/[id]/route.ts`             |
| **メンバー一覧 API**         | ✅ 完了  | `apps/web/src/app/api/groups/[id]/members/route.ts`     |
| **招待発行 API**             | ✅ 完了  | `apps/web/src/app/api/groups/[id]/invitations/route.ts` |
| **招待参加 API**             | ✅ 完了  | `apps/web/src/app/api/invitations/accept/route.ts`      |
| **ダッシュボード**           | ✅ 完了  | `apps/web/src/app/dashboard/page.tsx`                   |
| **グループ一覧**             | ✅ 完了  | `apps/web/src/components/GroupList.tsx`                 |
| **グループ作成**             | ✅ 完了  | `apps/web/src/app/dashboard/groups/new/page.tsx`        |
| **グループ詳細・編集・削除** | ✅ 完了  | `apps/web/src/app/dashboard/groups/[id]/page.tsx`       |
| **招待ページ**               | ✅ 完了  | `apps/web/src/app/invite/page.tsx`                      |

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

| 項目                   | 実装状況 | 備考                                              |
| ---------------------- | -------- | ------------------------------------------------- |
| **Item CRUD API**      | ✅ 完了  | 作成・取得・更新・削除                            |
| **暗号化/復号**        | ✅ 完了  | AES-256（`@vault-share/crypto`）                  |
| **アクセス制御**       | ✅ 完了  | グループメンバーのみアクセス可能                  |
| **論理削除**           | ✅ 完了  | `deletedAt` フィールドで管理                      |
| **Item 作成フォーム**  | ✅ 完了  | グループ詳細ページ内                              |
| **監査ログ**           | ✅ 完了  | アイテム作成・更新・削除時に記録                  |
| **カテゴリフィルタ**   | ✅ 完了  | グループ詳細ページにフィルタ UI 追加              |
| **タイトル・本文検索** | ✅ 完了  | `GET .../items?search=`（API 側で復号後フィルタ） |

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

## 未実装・部分実装

### ⚠️ 1Password 連携（R4）— 部分実装

| 項目                  | 実装状況    | 備考                                                                     |
| --------------------- | ----------- | ------------------------------------------------------------------------ |
| **CSV インポート**    | ✅ 実装済み | `apps/web/src/lib/csv/`、グループ詳細からのインポート導線                |
| **1PUX インポート**   | ✅ 実装済み | `apps/web/src/lib/1pux/`                                                 |
| **CSV エクスポート**  | ✅ 実装済み | グループ詳細 UI から 1Password 互換 CSV ダウンロード                     |
| **1Password Connect** | ⚠️ 任意     | Connect 設定時は `/dashboard/groups/[id]/1password`、未設定時は CSV 案内 |

**残作業（任意）:**

- 本番での Connect トークン・URL 運用、大規模 vault のパフォーマンス調整

**参考ドキュメント:**

- `docs/01-research/05-1password-connect-pricing.md`

---

### ✅ R12（レート制限・セキュリティヘッダ）— 一部実装済み

| 項目                   | 実装状況 | 備考                                                                  |
| ---------------------- | -------- | --------------------------------------------------------------------- |
| **セキュリティヘッダ** | ✅       | `apps/web/next.config.js`（CSP・HSTS・`base-uri` / `form-action` 等） |
| **レート制限**         | ✅       | セッション発行・パスワードリセット等（Firestore `rateLimits`）        |
| **グローバル WAF**     | ❌       | Cloud Armor 等は未設定（必要に応じて GCP 側）                         |

---

### ❌ その他（設計スコープ外に近いもの）

- **全ユーザーへの MFA 強制（ポリシー）**: UI・ログインフローはあるが、環境変数での一律拒否は新規ユーザーのデッドロックになるため未採用。Identity Platform / 運用ポリシーで検討。

---

## インフラ・CI/CD

### ✅ 基本インフラ

| 項目                  | 実装状況    | 備考                              |
| --------------------- | ----------- | --------------------------------- |
| **Pulumi IaC**        | ✅ 実装済み | `infra/index.ts`                  |
| **Secret Manager**    | ✅ 設定済み | `vault-share-item-encryption-key` |
| **Firestore**         | ✅ 作成済み | Native モード（asia-northeast1）  |
| **Identity Platform** | ✅ 設定済み | メール/パスワードのみ有効         |

### ⚠️ CI/CD

| 項目                                  | 実装状況    | 備考                            |
| ------------------------------------- | ----------- | ------------------------------- |
| **GitHub Actions（lint/test/build）** | ✅ 実装済み | `.github/workflows/ci.yml`      |
| **Cloud Run デプロイ**                | ❌ 未実装   | GitHub Actions での自動デプロイ |

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

1. **運用・セキュリティの仕上げ**
   - Identity Platform / GCP での MFA・メールテンプレート・承認ドメインの本番確認
   - 監査ログの保管期間・エクスポート運用

### 中優先度

2. **1Password Connect の本番運用**
   - トークン・URL の Secret 管理、接続先 VM / ネットワークのハードニング

3. **アイテム一覧のスケール**
   - グループあたり件数増加時の Firestore インデックス・サーバ側ページネーション見直し

### 低優先度

4. **Cloud Run デプロイの自動化**
   - GitHub Actions でのデプロイワークフロー（OIDC）

5. **Chrome 拡張・クライアント側暗号化**
   - 設計上スコープ外（将来）

---

## 補足

- 実装状況の確認は、コードベース検索とファイル読み取りで実施
- 各機能の詳細は設計ドキュメント（`docs/02-design/`）を参照
- 初期設定の完了状況は `docs/02-design/01-next-steps-and-initial-setup.md` を参照
