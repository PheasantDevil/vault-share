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

## 環境変数（ローカルでエミュレータ＋本番ビルドに近い起動をする場合）

CI（`.github/workflows/test-e2e.yml`）と同様に、少なくとも次を設定してください。

- `ITEM_ENCRYPTION_KEY` — 32 バイトの base64（統合テストと同じ固定値でも可）
- `FIRESTORE_EMULATOR_HOST` / `FIREBASE_AUTH_EMULATOR_HOST` — エミュレータ利用時
- `SESSION_SECRET` — 16 文字以上
- 任意: セッション API のレート制限を避ける `E2E_SKIP_RATE_LIMIT=1`（複数 spec を連続実行する場合）

シード: `pnpm run seed:e2e`（エミュレータ起動後、`apps/web` で実行）

## 注意事項

- **GitHub Actions** では Firebase Emulator + `pnpm start` で E2E を実行します（上記環境変数をワークフローで設定済み）
- ローカルでは `playwright.config` の `webServer` により `pnpm dev` を起動してテストします（`.env.local` で Firebase クライアント用変数を設定してください）
