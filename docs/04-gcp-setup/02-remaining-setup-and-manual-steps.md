# 未対応項目の対応：実行済みコマンドと手動設定手順

## 1. このタイミングでコマンド実行した項目（完了）

以下は **コマンドで実行済み** です。再実行の必要はありません。

| 項目                                  | 実行内容                                                                                                                         | 結果                                                               |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **Cloud Run / Artifact Registry API** | `gcloud services enable run.googleapis.com artifactregistry.googleapis.com --project=vault-share-dev`                            | 有効化済み                                                         |
| **Firestore データベース**            | `gcloud firestore databases create --location=asia-northeast1 --project=vault-share-dev`                                         | `(default)` データベース作成済み（Native モード・asia-northeast1） |
| **Pulumi の初回実行**                 | `infra/` で `pulumi login --local` → `pulumi stack init dev` → `GOOGLE_PROJECT=vault-share-dev pulumi up --yes`                  | Secret リソース・API 有効化済み                                    |
| **Secret Manager の鍵**               | `openssl rand -base64 32 \| gcloud secrets versions add vault-share-item-encryption-key --project=vault-share-dev --data-file=-` | バージョン 1 を登録済み                                            |

---

## 2. 手動設定が必要な項目と具体的な手順

以下は **コンソールでのみ設定可能** なため、**手動で実施** してください。Pulumi と Secret 鍵は上記のとおりコマンド実行済みです。

---

### 2.1 Pulumi の初回実行（参考：再実行時や別環境用）

**目的**: Secret Manager の Secret リソース（`vault-share-item-encryption-key`）作成と、関連 API の有効化。

**※ 本環境では上記「1. コマンド実行した項目」のとおり実行済みです。** 別マシンや再実行時は以下を参照してください。

#### 手順

1. **Pulumi CLI のインストール（未導入の場合）**
   - macOS (Homebrew): `brew install pulumi`
   - または [公式](https://www.pulumi.com/docs/install/) の手順に従う。
   - 確認: `pulumi version`

2. **Pulumi にログイン**

   ```bash
   pulumi login
   ```

   - ブラウザが開くので、Pulumi アカウントでサインイン。
   - 非対話環境やローカルのみでよい場合: `pulumi login --local`（ステートはローカルに保存）。

3. **GCP のアプリケーション default 認証（未実施の場合）**

   ```bash
   gcloud auth application-default login
   gcloud auth application-default set-quota-project vault-share-dev
   ```

4. **infra でスタック作成・初回デプロイ**

   ```bash
   cd /Users/Work/vault-share/infra
   npm install
   # ローカルスタックの場合（パスフレーズは任意。以降の pulumi コマンドでも同じ値を export すること）
   export PULUMI_CONFIG_PASSPHRASE=dev
   pulumi stack init dev
   pulumi config set gcp:project vault-share-dev
   # プロジェクトは config または環境変数 GOOGLE_PROJECT で指定
   GOOGLE_PROJECT=vault-share-dev pulumi up --yes
   ```

   - 完了後、GCP コンソールの Secret Manager に `vault-share-item-encryption-key` が作成されていることを確認。

---

### 2.2 Identity Platform のプロバイダ設定（メール/パスワードのみ）

**目的**: アプリからメール/パスワードでログインできるようにする。**Google ログインは使用しません。** ログインは**許可されたメールアドレスのみ**とし、アプリ側で許可リストを運用します。

**方法**: **GCP コンソールでのみ設定可能**（CLI ではプロバイダの有効化ができません）。

#### 手順

1. **コンソールを開く**
   - [Google Cloud Console](https://console.cloud.google.com/) にログインし、プロジェクト **vault-share-dev** を選択。

2. **Identity Platform を開く**
   - 左上メニュー（ハンバーガー）→ **ビルド** → **Identity Platform**。
   - または検索バーで「Identity Platform」を検索。

3. **メール/パスワードのみ有効化**
   - **プロバイダ** タブを開く。
   - **メール/パスワード** の行で **有効にする** をクリック。
   - 必要に応じて「メール リンク（パスワードなしサインイン）」のオン/オフを設定し、**保存**。
   - **Google は有効にしない**（同じタブの Google の行は「無効」のままにすること）。

4. **確認**
   - **プロバイダ** 一覧で「メール/パスワード」が **有効**、「Google」は **無効** であることを確認。

---

### 2.3 Secret Manager に AES-256 鍵を登録（参考：Pulumi 実行後・再登録時）

**目的**: 項目暗号用の AES-256 鍵を Secret `vault-share-item-encryption-key` の **バージョン** として登録する。

**※ 本環境では上記「1. コマンド実行した項目」のとおり 1 回実行済みです。** 別環境や鍵の再登録時は以下を参照してください。

**前提**: **2.1 Pulumi の初回実行** が完了し、Secret `vault-share-item-encryption-key` が存在していること。

#### 手順（コマンドで実行可能）

1. **32 バイトの鍵を生成し、Secret にバージョンとして追加**

   ```bash
   # 鍵を生成して Secret に追加（Base64 で 1 行）
   openssl rand -base64 32 | gcloud secrets versions add vault-share-item-encryption-key \
     --project=vault-share-dev \
     --data-file=-
   ```

   - 本番では、生成した鍵を **安全に保管** し、同じ鍵を再登録する場合は `--data-file=-` でその内容を渡す。

2. **確認**

   ```bash
   gcloud secrets versions list vault-share-item-encryption-key --project=vault-share-dev
   ```

   - バージョン 1 が表示されれば完了。

**注意**: 鍵の値はアプリから **参照** するだけで、コンソールで「値の表示」はしない運用を推奨します。再生成した場合は新しいバージョンを追加し、アプリ側でバージョン指定するか、常に `latest` を参照するように実装してください。

---

## 3. 確認の目安（初期設定完了後）

以下が満たされていれば、認証・Firestore・暗号化の実装に進んで問題ありません。

- [ ] GCP にログイン済み（`gcloud auth list`）
- [ ] プロジェクト `vault-share-dev` が選択されている
- [ ] Firestore に `(default)` データベースが存在する（asia-northeast1）
- [ ] Identity Platform で「メール/パスワード」のみ有効（Google は無効のまま）
- [ ] Secret Manager に `vault-share-item-encryption-key` が存在し、少なくとも 1 つのバージョンが登録されている
