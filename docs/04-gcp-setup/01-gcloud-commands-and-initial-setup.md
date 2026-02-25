# GCP 初期設定と gcloud コマンド一覧

## 前提

- **Google Cloud CLI (gcloud)** はローカルにインストール済みである想定です。動作確認は `which gcloud` および `gcloud version` で行えます。
- 本ドキュメントは**手順とコマンドの記載のみ**です。**実際の実行は利用者が行ってください。**

---

## 1. 初期設定に含める項目（このタイミングで構築する想定）

以下の順で行うと、その後の実装（認証・Firestore・Secret Manager・Pulumi）がスムーズです。

| 順番 | 項目                     | 内容                                                                                                                                                         |
| ---- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1    | **GCP ログイン**         | `gcloud auth login` で利用する Google アカウントでログインする。                                                                                             |
| 2    | **GCP プロジェクト作成** | 本サービス（vault-share）用のプロジェクトを 1 つ作成する。                                                                                                   |
| 3    | **課金の有効化**         | 作成したプロジェクトに課金アカウントを紐づける（コンソールで実施）。                                                                                         |
| 4    | **以降**                 | Firestore 作成、Identity Platform 設定、Pulumi 実行、Secret Manager 鍵登録（これらは 02-design/01-next-steps-and-initial-setup.md の「未完了項目」に記載）。 |

**GCP ログインとプロジェクト作成は初期設定で必要**です。このタイミングで構築しておくことを推奨します。

---

## 2. gcloud コマンド一覧（実行は利用者判断）

### 2.1 認証・状態確認

```bash
# ログイン（ブラウザが開き、Google アカウントで認証）
gcloud auth login

# 現在の認証アカウント一覧
gcloud auth list

# アプリケーションのデフォルト認証（ローカル実行・Pulumi 等で使用）
gcloud auth application-default login
```

### 2.2 プロジェクト

```bash
# プロジェクト作成（プロジェクト ID は小文字・数字・ハイフンのみ、グローバルで一意）
gcloud projects create <PROJECT_ID> --name="vault-share"

# 現在のプロジェクト設定を確認
gcloud config get-value project

# デフォルトのプロジェクトを設定
gcloud config set project <PROJECT_ID>

# プロジェクト一覧
gcloud projects list
```

### 2.3 課金の紐づけ（gcloud では作成のみ）

課金アカウントの**紐づけ**は Google Cloud コンソールで行います。

1. [コンソール](https://console.cloud.google.com/) → 対象プロジェクトを選択
2. 「お支払い」→「アカウントをリンク」で既存の課金アカウントをリンク（または新規作成）

無料枠でも課金アカウントのリンクは必要です（クレジットカード登録等）。

### 2.4 利用する API の有効化（オプション：Pulumi で行う場合は不要）

Pulumi（`infra/`）で API 有効化を行う場合は、以下は省略可能です。

```bash
# Firestore API
gcloud services enable firestore.googleapis.com --project=<PROJECT_ID>

# Secret Manager API
gcloud services enable secretmanager.googleapis.com --project=<PROJECT_ID>

# Identity Platform（identitytoolkit）
gcloud services enable identitytoolkit.googleapis.com --project=<PROJECT_ID>
```

### 2.5 その他（参照用）

```bash
# デフォルトリージョン（必要に応じて）
gcloud config set compute/region asia-northeast1

# 設定一覧
gcloud config list
```

---

## 3. ローカル環境の確認結果（参考）

- **gcloud のパス**: `/opt/homebrew/bin/gcloud`（インストール済み）
- **バージョン**: Google Cloud SDK 554.0.0 等
- **認証**: `gcloud auth list` で確認可能（実行時点でログイン済みのアカウントが表示される）

初期設定を実行する際は、上記コマンドを順に実行してください。

---

## 4. 初期設定時に実行したコマンド（記録）

実施場所: `/Users/Work/vault-share`。GitHub 同様、実行したコマンドを記録として残す。

```bash
# 1. ログイン（利用者が事前に実行済み）
gcloud auth list

# 2. プロジェクト作成（プロジェクト ID: vault-share-dev）
gcloud projects create vault-share-dev --name="vault-share"

# 3. デフォルトプロジェクトに設定
gcloud config set project vault-share-dev

# 4. Firestore API 有効化
gcloud services enable firestore.googleapis.com --project=vault-share-dev

# 5. Identity Platform（identitytoolkit）API 有効化
gcloud services enable identitytoolkit.googleapis.com --project=vault-share-dev

# 6. Secret Manager API 有効化（課金アカウントリンク後に実行）
gcloud services enable secretmanager.googleapis.com --project=vault-share-dev
```

**結果**: 1〜6 はいずれも実行済み（プロジェクト vault-share-dev）。課金リンク後に 6 を実行した。

**オプション（Pulumi やローカルアプリで GCP を使う場合）**:

```bash
gcloud auth application-default login
gcloud auth application-default set-quota-project vault-share-dev
```
