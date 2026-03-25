# （任意・有料前提）GCE 上の Connect に Caddy で HTTPS を載せる

**ドメイン登録（年額）が前提**です。費用をかけたくない段階では [`05-onepassword-connect-cloud-run.md`](./05-onepassword-connect-cloud-run.md) のとおり **`http://<IP>:8080`** のまま運用してください。

## 前提

- Connect が **既に VM 上の Docker Compose** で動いている（`127.0.0.1:8080` で API が応答する）
- **自分のドメイン**を [Cloud Domains](https://cloud.google.com/domains) 等で取得済み
- DNS で **A レコード**（例: `connect.example.com`）が **VM の外部 IP** を向いている
- ファイアウォールで **tcp:80, 443** が VM に届く（例: タグ `connect-server` に対する `allow-connect-https`）

## 手順概要

1. DNS が VM の IP を指すまで待つ（伝播）
2. VM に Caddy を Docker で起動し、`connect.example.com` → `localhost:8080` にリバースプロキシ
3. Let’s Encrypt が自動取得（Caddy デフォルト）
4. GitHub の `ONEPASSWORD_CONNECT_URL` を **`https://connect.example.com`** に更新し、再デプロイ

## VM 上のコマンド例

`connect.example.com` を実ドメインに置き換える。

```bash
# SSH で VM に入る
gcloud compute ssh onepassword-connect \
  --zone=asia-northeast1-a \
  --project=vault-share-dev

# Caddy 用ディレクトリ
sudo mkdir -p /opt/caddy && sudo chown "$USER:$USER" /opt/caddy
cd /opt/caddy
```

`/opt/caddy/Caddyfile` を作成:

```text
connect.example.com {
  reverse_proxy 127.0.0.1:8080
}
```

Caddy 起動（公式イメージ。証明書は `/data` に永続化）:

```bash
docker run -d --name caddy --restart unless-stopped \
  -p 80:80 -p 443:443 \
  -v /opt/caddy/Caddyfile:/etc/caddy/Caddyfile \
  -v caddy_data:/data \
  caddy:2
```

ログ確認:

```bash
docker logs -f caddy
```

## 確認

```bash
curl -sS -o /dev/null -w "%{http_code}\n" https://connect.example.com/v1/vaults
# 401 なら API は TLS 越しに生きている（未認証でよい）
```

## Cloud Run 側

- GitHub **Secret または Variable** の `ONEPASSWORD_CONNECT_URL` を **`https://connect.example.com`**（末尾スラッシュなし）に変更
- `main` のデプロイを走らせる

## セキュリティ（推奨）

- 外向き **8080 を閉じ**、**443 経由のみ**公開する場合は、ファイアウォールで `allow-connect-op-api` を削除またはソースを限定する（運用に合わせて調整）
- SSH の全世界開放ルール（`allow-connect-ssh-bootstrap`）は削除し、IAP 等に寄せる（[`06-gce-onepassword-connect-vm.md`](./06-gce-onepassword-connect-vm.md)）

## 関連

- 当面の HTTP 構成: [05-onepassword-connect-cloud-run.md](./05-onepassword-connect-cloud-run.md)、[06-gce-onepassword-connect-vm.md](./06-gce-onepassword-connect-vm.md)
- ローカル Compose: `infra/1password-connect/README.md`
