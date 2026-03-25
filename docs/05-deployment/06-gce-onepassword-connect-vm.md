# vault-share-dev 上の 1Password Connect 用 GCE VM（参考）

自動構築で作成したリソースのメモ。

**当面（ドメイン費用をかけない場合）:** Cloud Run の `ONEPASSWORD_CONNECT_URL` は **`http://<外部IP>:8080`** でよい（[05-onepassword-connect-cloud-run.md](./05-onepassword-connect-cloud-run.md)）。

**HTTPS に移行する場合（ドメイン年額が発生）:** [07-onepassword-connect-caddy-https.md](./07-onepassword-connect-caddy-https.md) の Caddy 手順を参照する。

## インスタンス

| 項目         | 値                                 |
| ------------ | ---------------------------------- |
| 名前         | `onepassword-connect`              |
| ゾーン       | `asia-northeast1-a`                |
| マシンタイプ | `e2-small`                         |
| 外部 IP      | 次で確認（再起動で変わる場合あり） |

```bash
gcloud compute instances describe onepassword-connect \
  --zone=asia-northeast1-a \
  --project=vault-share-dev \
  --format='get(networkInterfaces[0].accessConfigs[0].natIP)'
```

## ファイアウォール（作成済み）

| ルール名                      | 許可                             | 備考                                             |
| ----------------------------- | -------------------------------- | ------------------------------------------------ |
| `allow-connect-https`         | tcp:80,443 → `connect-server`    | Caddy 等を載せるとき用                           |
| `allow-ssh-iap-connect`       | tcp:22 → IAP レンジ              | IAP 経由 SSH 用                                  |
| `allow-connect-ssh-bootstrap` | tcp:22 → 0.0.0.0/0               | **暫定・危険**。作業後に削除または自宅 IP のみに |
| `allow-connect-op-api`        | tcp:8080,8081 → `connect-server` | Connect API / デバッグ用                         |

**推奨:** セットアップ完了後、`allow-connect-ssh-bootstrap` を削除し、SSH は IAP のみにする。

```bash
gcloud compute firewall-rules delete allow-connect-ssh-bootstrap --project=vault-share-dev --quiet
```

## VM 内の配置

- ユーザーホーム: `~/connect/`
- `docker-compose.yaml` と `1password-credentials.json`
- `sudo docker compose up -d`（`~/connect` で実行）

## Cloud Run 向け URL（標準・HTTP）

**`http://<外部IP>:8080`** を `ONEPASSWORD_CONNECT_URL`（GitHub Secret または Variable）に設定する（当面の正式運用で可）。

HTTPS 化は任意: [07-onepassword-connect-caddy-https.md](./07-onepassword-connect-caddy-https.md)

## トークン

Cloud Run 用の **`ONEPASSWORD_CONNECT_TOKEN`** は GCP Secret Manager の `vault-share-onepassword-connect-token` を参照する。GitHub にトークンだけ登録しても Cloud Run には載らないため、`scripts/gcp/setup-onepassword-connect-secret.sh` で同期する。

## 関連

- [05-onepassword-connect-cloud-run.md](./05-onepassword-connect-cloud-run.md)
- [07-onepassword-connect-caddy-https.md](./07-onepassword-connect-caddy-https.md)
