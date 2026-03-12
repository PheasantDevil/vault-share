# 統合テスト・E2Eテスト実装計画

## 1. 要件の整理

### 1.1 統合テスト

| 項目 | 内容 |
|------|------|
| **APIエンドポイントのテスト** | 認証、グループCRUD、アイテムCRUD、招待フロー等のAPIテスト |
| **データベース操作のテスト** | Firestore操作のテスト（エミュレータ使用） |
| **認証フローのテスト** | セッション管理、MFA認証等のテスト |

### 1.2 E2Eテスト

| 項目 | 内容 |
|------|------|
| **主要ユーザーフロー** | ログイン → グループ作成 → アイテム作成 → 削除 |
| **招待フロー** | 招待発行 → 招待受け入れ |
| **MFAフロー** | MFA登録 → MFAログイン |
| **1Passwordインポートフロー** | 1Passwordインポートページでの操作 |

---

## 2. コンポーネント設計

### 2.1 統合テスト

#### 2.1.1 テスト環境

| コンポーネント | 役割 | 実装方法 |
|---------------|------|----------|
| **Firestoreエミュレータ** | テスト用のFirestore環境 | Firebase Emulator Suite |
| **認証モック** | テスト用の認証モック | Firebase Admin SDKのモック |
| **テストヘルパー** | 共通のテストユーティリティ | テスト用のヘルパー関数 |

#### 2.1.2 テスト対象

| テスト対象 | テスト内容 |
|-----------|----------|
| **認証API** | `/api/auth/session`, `/api/auth/logout` |
| **グループAPI** | `/api/groups`, `/api/groups/[id]` |
| **アイテムAPI** | `/api/groups/[id]/items`, `/api/groups/[id]/items/[itemId]` |
| **招待API** | `/api/groups/[id]/invitations`, `/api/invitations/accept` |

### 2.2 E2Eテスト

#### 2.2.1 テスト環境

| コンポーネント | 役割 | 実装方法 |
|---------------|------|----------|
| **Playwright** | E2Eテストフレームワーク | Playwright |
| **テストサーバー** | テスト用のNext.jsサーバー | Next.js開発サーバー |
| **テストデータ** | テスト用の初期データ | テストデータセットアップ |

#### 2.2.2 テストシナリオ

| シナリオ | テスト内容 |
|---------|----------|
| **ログインフロー** | ログインページ → ダッシュボード |
| **グループ作成フロー** | ダッシュボード → グループ作成 → グループ詳細 |
| **アイテム作成フロー** | グループ詳細 → アイテム作成 → アイテム表示 |
| **招待フロー** | グループ詳細 → 招待発行 → 招待受け入れ |
| **MFAフロー** | MFA設定 → MFA登録 → MFAログイン |

---

## 3. データ設計・状態管理

### 3.1 テストデータ

```typescript
interface TestUser {
  email: string;
  password: string;
  uid: string;
  displayName?: string;
}

interface TestGroup {
  id: string;
  name: string;
  createdBy: string;
}

interface TestItem {
  id: string;
  groupId: string;
  title: string;
  type: string;
  value: string;
}
```

### 3.2 テスト環境設定

```typescript
interface TestConfig {
  firestoreEmulatorHost: string;
  authEmulatorHost: string;
  testUser: TestUser;
  testGroup: TestGroup;
}
```

---

## 4. 懸念事項・エッジケース・パフォーマンス

| 懸念 | 対策 |
|------|------|
| **Firestoreエミュレータのセットアップ** | Firebase Emulator Suiteのセットアップ手順を文書化 |
| **認証のモック** | Firebase Admin SDKのモックまたはエミュレータ使用 |
| **テストデータのクリーンアップ** | 各テスト後にデータをクリーンアップ |
| **CI/CDでのテスト実行** | GitHub Actionsでのエミュレータ起動・テスト実行 |
| **テストの実行時間** | 並列実行、テストの最適化 |

---

## 5. 実装順序

1. **統合テスト環境のセットアップ**
   - Firestoreエミュレータの設定
   - テストヘルパーの実装
   - 認証モックの実装

2. **統合テストの実装**
   - APIエンドポイントの統合テスト
   - データベース操作の統合テスト
   - 認証フローの統合テスト

3. **E2Eテスト環境のセットアップ**
   - Playwrightの設定
   - テストサーバーの起動設定
   - テストデータのセットアップ

4. **E2Eテストの実装**
   - 主要ユーザーフローのE2Eテスト
   - 招待フローのE2Eテスト
   - MFAフローのE2Eテスト

5. **CI/CDへの統合**
   - GitHub Actionsでのテスト実行設定
   - エミュレータの起動・停止設定

---

## 6. 実装詳細

### 6.1 統合テスト

**テストファイル構成:**
- `apps/web/src/test/integration/api/auth.test.ts` - 認証APIの統合テスト
- `apps/web/src/test/integration/api/groups.test.ts` - グループAPIの統合テスト
- `apps/web/src/test/integration/api/items.test.ts` - アイテムAPIの統合テスト
- `apps/web/src/test/integration/helpers/` - テストヘルパー

**テストヘルパー:**
- `setup-test-env.ts` - テスト環境のセットアップ
- `test-data.ts` - テストデータの生成
- `auth-helper.ts` - 認証ヘルパー（テスト用トークン生成等）

### 6.2 E2Eテスト

**テストファイル構成:**
- `apps/web/e2e/auth.spec.ts` - 認証フローのE2Eテスト
- `apps/web/e2e/groups.spec.ts` - グループ操作のE2Eテスト
- `apps/web/e2e/items.spec.ts` - アイテム操作のE2Eテスト
- `apps/web/e2e/invitations.spec.ts` - 招待フローのE2Eテスト
- `apps/web/e2e/mfa.spec.ts` - MFAフローのE2Eテスト

**Playwright設定:**
- `playwright.config.ts` - Playwright設定ファイル
- テストサーバーの起動設定
- スクリーンショット・動画の設定

---

## 7. 参考資料

- Firebase Emulator Suite: [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)
- Playwright: [Playwright Documentation](https://playwright.dev/)
- Vitest: [Vitest Documentation](https://vitest.dev/)
