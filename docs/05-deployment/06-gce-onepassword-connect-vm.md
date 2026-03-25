# vault-share-dev 上の 1Password Connect 用 GCE VM（参考）

自動構築で作成したリソースのメモ。**本番運用前にドメイン＋HTTPS（Caddy 等）とファイアウォールの見直し**を推奨する。

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

## Cloud Run 向け URL（HTTP の場合）

検証では **`http://<外部IP>:8080`** を `ONEPASSWORD_CONNECT_URL`（GitHub Secret または Variable）に設定できる。本番では **HTTPS + 固定ドメイン**に切り替えること。

## トークン

Cloud Run 用の **`ONEPASSWORD_CONNECT_TOKEN`** は GCP Secret Manager の `vault-share-onepassword-connect-token` を参照する。GitHub にトークンだけ登録しても Cloud Run には載らないため、`scripts/gcp/setup-onepassword-connect-secret.sh` で同期する。

## 関連

- [05-onepassword-connect-cloud-run.md](./05-onepassword-connect-cloud-run.md)
