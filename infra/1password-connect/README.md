# ローカル用 1Password Connect（CLI 方法 B + Docker Compose）

vault-share の「1Passwordからインポート」は、サーバー環境変数 `ONEPASSWORD_CONNECT_URL` / `ONEPASSWORD_CONNECT_TOKEN` で Connect REST API に接続します。  
ここでは **1Password CLI** で Connect サーバーと資格情報を作り、**Docker Compose** で API をローカル起動する手順をまとめます。

## 前提

- [1Password CLI](https://developer.1password.com/docs/cli/get-started/) が入っている（`op --version`）
- 1Password アカウントで **Secrets Automation（Connect）を管理できるグループ**に所属していること  
  参考: [Manage Connect](https://developer.1password.com/docs/connect/manage-connect/)
- Connect が読める **共有用 vault** を用意していること（Personal / Private / Employee やデフォルト Shared は不可）  
  参考: [Create a vault](https://support.1password.com/create-share-vaults/)
- [Docker](https://docs.docker.com/engine/install/) と Docker Compose（`docker compose version`）

## ステップ 1: CLI でサーバー定義と `1password-credentials.json` を作る

**このディレクトリに移動してから**実行すると、資格情報ファイルがここに生成され、Compose とパスが一致します。

```bash
cd infra/1password-connect
```

### 1-1. サインイン（未設定の場合）

初回は `op signin` だけだと「アプリ連携でサインイン」と案内されることがあります。対話でアカウントを足すなら:

```bash
eval $(op signin)
# 「No accounts configured」と出たら案内に従い Y → op account add 相当の入力
```

- **Sign-in address** には **`my.1password.com` のような `*.1password.com`** を入れる（メールアドレスではない）。
- **メール・Secret Key・マスターパスワード**は 1Password の案内どおり。入力は **スクリーンショットやターミナル履歴に残りやすい**ので、共有 PC では避ける。

### 1-2. Connect サーバーを作成

`<サーバー名>` は任意（例: `vault-share-local`）。  
`<vault名>` は **実在する共有 vault 名**に置き換える（スペースを含む場合は引用符で囲む）。

```bash
op connect server create "vault-share-prod" --vaults "P_vault-share"
```

- カレントディレクトリに **`1password-credentials.json`** が生成される。
- vault を後から足す場合: [`op connect vault grant`](https://developer.1password.com/docs/cli/reference/management-commands/connect/#connect-vault-grant)

### 1-3. API 用トークンを発行

サーバー一覧で ID を確認する場合:

```bash
op connect server list
```

トークン作成（公式ではサーバー指定に ID 推奨）:

```bash
op connect token create "<トークンのラベル>" <サーバーIDまたはサーバー名>
```

表示された **トークン文字列**をコピーする（再表示不可のため 1Password 等に安全に保存）。

## ステップ 2: Docker Compose で Connect を起動

```bash
cd infra/1password-connect
docker compose up -d
```

またはリポジトリルートから:

```bash
pnpm run connect:up
```

- **Connect API**: ホストの `http://localhost:8080`（vault-share の `ONEPASSWORD_CONNECT_URL` は `http://localhost:8080`）
- sync コンテナのデバッグ用にホスト `8081` も公開（公式例と同じ）

## ステップ 3: API の疎通確認

```bash
export OP_API_TOKEN='（1-3 で発行したトークン）'
curl -sS -H "Authorization: Bearer $OP_API_TOKEN" http://localhost:8080/v1/vaults
```

## ステップ 4: vault-share（Next.js）に渡す

`apps/web/.env.local` に追加:

```bash
ONEPASSWORD_CONNECT_URL=http://localhost:8080
ONEPASSWORD_CONNECT_TOKEN=<1-3 のトークン>
```

開発サーバーを再起動し、グループ詳細から「1Passwordからインポート」を開く。

## Cloud Run（本番）で使う

ローカルの `localhost` は本番からは見えない。**当面は VM の `http://<外部IP>:8080`** を `ONEPASSWORD_CONNECT_URL` に設定する手順は [`docs/05-deployment/05-onepassword-connect-cloud-run.md`](../../docs/05-deployment/05-onepassword-connect-cloud-run.md)。  
ドメイン取得後に **HTTPS（Caddy）** する場合は [`docs/05-deployment/07-onepassword-connect-caddy-https.md`](../../docs/05-deployment/07-onepassword-connect-caddy-https.md)。

## 停止・ログ

```bash
pnpm run connect:down
pnpm run connect:logs
```

## セキュリティ

- **`1password-credentials.json` とトークンはリポジトリにコミットしない**（`.gitignore` 済み）。
- トークン漏えい時は [`op connect token delete`](https://developer.1password.com/docs/cli/reference/management-commands/connect/#connect-token-delete) で失効させる。
- **Secret Key やパスワードをターミナルに貼った／ログに残った**と思ったら、1Password 側で **Secret Key の再生成（アカウントの復旧キーまわり）**を検討する。ターミナル履歴・Cursor のログに平文が残ることがある。

## トラブルシュート: `killed` / `exit code: 137`

`op connect server create` が **`[1] xxxxx killed`** で終わり、**`echo $?` が 137** のときは、多くの環境で **SIGKILL（シグナル 9）** による強制終了である。**正常終了（0）ではない。**

### よくある原因と対処

1. **統合ターミナル（Cursor / VS Code 等）**  
   子プロセスが制限付き環境で **OOM やセキュリティポリシーで落とされる**ことがある。  
   **対処:** **macOS の「ターミナル.app」または iTerm2** を開き、同じ `cd` と `op connect server create ...` を実行する。

2. **メモリ不足**  
   他アプリを減らす・マシン再起動後に再試行。

3. **CLI の不具合・古さ**  
   `brew upgrade 1password-cli` で更新し、再実行。

4. **権限・プラン**  
   `op connect server list` が空のままかつ create が毎回落ちる場合、**Secrets Automation を管理する権限**や契約の制限も疑う。1Password の **Developer / Connect servers** 画面でブラウザから作成できるか確認する（下記「方法 A」）。

### 代替: ブラウザでステップ 1 だけ行う（公式・方法 A）

CLI が使えない場合は [Secrets Automation / Connect の作成ウィザード](https://start.1password.com/developer-tools/infrastructure-secrets/connect) から Connect サーバーを作り、**`1password-credentials.json` とアクセストークンをダウンロード／コピー**する。  
生成した `1password-credentials.json` を **`infra/1password-connect/` に置き**、この README の **ステップ 2 以降（Docker Compose）**だけ進めればよい。

## 参考リンク

- [Get started with a 1Password Connect server](https://developer.1password.com/docs/connect/get-started/)
- [Connect API reference](https://developer.1password.com/docs/connect/api-reference/)
- [公式 Docker Compose 例（upstream）](https://github.com/1Password/connect/tree/main/examples/docker/compose)
