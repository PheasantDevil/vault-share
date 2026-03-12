# E2Eテスト

## 概要

E2Eテストは、Playwrightを使用してブラウザ上で実際のユーザーフローをテストします。

## セットアップ

1. Playwrightブラウザをインストール:
```bash
cd apps/web
pnpm exec playwright install --with-deps chromium
```

2. 開発サーバーを起動:
```bash
pnpm dev
```

3. 別のターミナルでテストを実行:
```bash
cd apps/web
pnpm test:e2e
```

または、UIモードで実行:
```bash
pnpm test:e2e:ui
```

## テストファイル

- `auth.spec.ts` - 認証フローのE2Eテスト
- `groups.spec.ts` - グループ操作のE2Eテスト
- `items.spec.ts` - アイテム操作のE2Eテスト

## 注意事項

- E2Eテストは実際のFirebase環境を使用します（エミュレータではありません）
- テスト用のユーザーとデータが必要です
- CI/CDでは自動的に開発サーバーが起動されます
