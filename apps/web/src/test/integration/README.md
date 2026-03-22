# 統合テスト

## 概要

統合テストは、Firebase Emulator Suiteを使用してFirestoreとAuthのエミュレータ環境で実行されます。

## セットアップ

### 前提（macOS / Homebrew）

Firebase Emulator Suite は **Java（JDK）** が必要です。CI では Temurin 21 を想定しているため、ローカルも **JDK 21 系**を推奨します。

```bash
brew install openjdk@21
```

シェルに `JAVA_HOME` と `PATH` を追加（`~/.zshrc` など）:

```bash
export JAVA_HOME="$(brew --prefix openjdk@21)/libexec/openjdk.jdk/Contents/Home"
export PATH="$JAVA_HOME/bin:$PATH"
```

確認:

```bash
java -version   # openjdk version "21.x" であること
```

（任意）システムの Java ラッパーからも参照したい場合は、Homebrew の案内どおりシンボリックリンクを張る方法もあります。

### Firebase CLI

このリポジトリでは `apps/web` の devDependency に `firebase-tools` が含まれています。グローバルに入れる場合:

```bash
pnpm add -g firebase-tools
```

### アイテム暗号化キー

`ITEM_ENCRYPTION_KEY` は 32 バイトの **base64**（`openssl rand -base64 32` と同等の長さ）です。  
`test:integration:with-emulators` および `setupTestEnv()` 実行時は未設定なら **統合テスト用の固定値**が自動設定されます。手動でエミュレータを起動して `pnpm test:integration` だけ流す場合は、上記 `ITEM_ENCRYPTION_KEY` を環境変数で渡すか、`.env.test` 等で設定してください。

### ワンショット実行（エミュレータ起動込み）

リポジトリルートから（上記 `JAVA_HOME` を設定したターミナルで）:

```bash
pnpm --filter web run test:integration:with-emulators
```

### 手動: エミュレータを別ターミナルで起動する場合

1. エミュレータを起動:

```bash
cd apps/web
pnpm exec firebase emulators:start --only firestore,auth
```

2. 別のターミナルでテストを実行:

```bash
cd apps/web
FIRESTORE_EMULATOR_HOST=localhost:8080 \
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099 \
SESSION_SECRET=test-secret-key-for-integration-tests-min-16-chars \
ITEM_ENCRYPTION_KEY=QkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkI= \
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
