# 統合テスト

## 概要

統合テストは、Firebase Emulator Suiteを使用してFirestoreとAuthのエミュレータ環境で実行されます。

## セットアップ

1. Firebase CLIをインストール:

```bash
pnpm add -g firebase-tools
```

2. エミュレータを起動:

```bash
firebase emulators:start --only firestore,auth
```

3. 別のターミナルでテストを実行:

```bash
cd apps/web
FIRESTORE_EMULATOR_HOST=localhost:8080 \
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099 \
SESSION_SECRET=test-secret-key-for-integration-tests-min-16-chars \
pnpm test:integration
```

## テストファイル

- `api/groups.test.ts` - グループAPIの統合テスト
- `api/items.test.ts` - アイテムAPIの統合テスト
- `api/auth.test.ts` - 認証APIの統合テスト

## テストヘルパー

- `helpers/setup-test-env.ts` - テスト環境のセットアップ
- `helpers/test-data.ts` - テストデータの生成
- `helpers/auth-helper.ts` - 認証ヘルパー
