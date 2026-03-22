# Firestore のグループ関連データを全削除する

API の不整合やインデックス・キャッシュ起因で症状が残る場合、**グループに紐づく Firestore データだけ**を空にすると早いことがあります。

## 削除するコレクション（トップレベル）

| コレクション   | 内容                             |
| -------------- | -------------------------------- |
| `items`        | グループ内アイテム（暗号化済み） |
| `groupMembers` | グループとユーザーの紐付け       |
| `invitations`  | 招待                             |
| `auditLogs`    | 監査ログ                         |
| `groups`       | グループ本体                     |

## 削除しないもの

- **`users`** — ログイン用のユーザープロファイル（消すと許可リストと整合が崩れる場合あり）
- **`rateLimits`** — レート制限用（必要なら別途整理）
- **Firebase Auth のアカウント** — 別サービス。Firestore だけ消しても Auth ユーザーは残ります。

## 方法 A: リポジトリのスクリプト（推奨）

1. GCP で対象プロジェクト（例: `vault-share-dev`）に **Firestore 削除権限**のあるアカウントでログインする。
2. Application Default Credentials を取得する:

   ```bash
   gcloud auth application-default login
   gcloud auth application-default set-quota-project vault-share-dev
   ```

3. プロジェクト ID を指定して実行:

   ```bash
   cd apps/web
   export GOOGLE_CLOUD_PROJECT=vault-share-dev
   pnpm run clear:firestore-group-data
   ```

削除件数が各コレクションごとに表示されます。

## 方法 B: Firebase CLI

（ログイン済み `firebase login` かつプロジェクトが `vault-share-dev` の場合）

```bash
cd /path/to/vault-share
for c in items groupMembers invitations auditLogs groups; do
  firebase firestore:delete "$c" --recursive --force --project vault-share-dev --database "(default)"
done
```

ネットワークや権限で `Failed to fetch documents` になる場合は **方法 A** を試してください。

## 方法 C: コンソール

[Firestore データベース](https://console.firebase.google.com/) → 各コレクションを開き、ドキュメントを選択削除（小規模向け）。

## 削除後の動作

- ダッシュボードのグループ一覧は空になります。必要なら UI からグループを作り直してください。
- **本番で `users` を残している**限り、同じメールでログインし直せます。
