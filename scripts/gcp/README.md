# GCP 用スクリプト（1Password Connect）

| スクリプト                            | 用途                                                                                                               |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `provision-onepassword-connect-vm.sh` | GCE VM とファイアウォールを冪等作成。終了時に `ONEPASSWORD_CONNECT_URL` の候補を表示                               |
| `install-connect-on-vm.sh`            | `1password-credentials.json` と `infra/1password-connect/docker-compose.yaml` を VM に配置し Docker Compose で起動 |
| `setup-onepassword-connect-secret.sh` | Connect API トークンを Secret Manager に保存し IAM を付与（Cloud Run 用）                                          |

Cloud Run に `ONEPASSWORD_CONNECT_TOKEN` の Secret 参照がある状態で **`vault-share-onepassword-connect-token` が未作成**だと、新リビジョンのデプロイが失敗する。先に `setup-onepassword-connect-secret.sh` でシークレットを作成すること。

詳細は [`docs/05-deployment/05-onepassword-connect-cloud-run.md`](../../docs/05-deployment/05-onepassword-connect-cloud-run.md) を参照。
