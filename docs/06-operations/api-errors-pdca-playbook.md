# API エラー対応プレイブック（PDCA）

本番・検証環境で API が **4xx/5xx** になったときの切り分けと改善の流れを、今回の事例（Firestore インデックス・Cloud Run リビジョン・認証まわり）を踏まえて **PDCA** で整理する。

## Plan（計画：何が起きているか決める）

### 1. 事実の固定

- **URL・HTTP メソッド・ステータスコード**（例: `GET .../api/groups/{id}/items` → 500）
- **レスポンス本文**（アプリが `originalError` や `code` を返していればそのままメモ。個人情報・トークンはマスク）
- **再現条件**: 本番 URL か、プレビュー URL か、ローカルか
- **ブラウザのシークレット／キャッシュ削除で直るか**  
  → **サーバー側（Cloud Run・Firestore・認証）の不具合では直らない**ことが多い。再現確認用には有効だが、「直った＝原因解消」とは限らない。

### 2. 仮説を列挙する（よくあるパターン）

| 観察                                                | 疑うこと                                                                                                  |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `FAILED_PRECONDITION` / 「query requires an index」 | Firestore の **複合インデックス未作成**、または **古いバイナリが `orderBy` 付きクエリをまだ実行**している |
| 本番だけ失敗・ローカルは成功                        | **デプロイ差分**（古い Cloud Run リビジョン）、**別プロジェクトの Firestore**、環境変数差                 |
| 401（CLI / 管理操作）                               | **OAuth トークン失効**、`GOOGLE_APPLICATION_CREDENTIALS` の **別 SA・期限切れキー**が優先されている       |

### 3. 参照するリポジトリ内の手掛かり

- API 実装: `apps/web/src/app/api/`
- Firestore インデックス定義: `firestore.indexes.json`
- 本番デプロイ: `.github/workflows/deploy.yml`（サービス名 `vault-share-web`、リージョンは Variables の `GCP_REGION`、多くは `asia-northeast1`）
- ビルドとコミットの対応: `GET /api/config` の **`buildSha`**（Docker ビルド時 `BUILD_SHA` が渡っている場合）

---

## Do（実行：切り分けと応急処置）

### A. アプリ／コードが想定どおりか

1. 該当ルートのハンドラと、呼び出している Firestore クエリを読む（`where` / `orderBy` の有無）。
2. ローカルで **本番に近い形**の確認が必要なら、認証 Cookie や ADC を揃えたうえで `curl` する。
   - **認証情報をチャットやチケットに貼らない。**

### B. Cloud Run：古いリビジョンが動いていないか（本番が古いコードのとき）

プロジェクト ID・リージョンは環境に合わせて置き換える。

```bash
export PROJECT_ID=<GCP_PROJECT_ID>
export REGION=asia-northeast1   # 例。実際のリージョンに合わせる
export SERVICE=vault-share-web

gcloud config set project "$PROJECT_ID"

gcloud run services describe "$SERVICE" \
  --region="$REGION" \
  --format='yaml(status.traffic,status.latestReadyRevisionName,status.url)'

gcloud run revisions list \
  --service="$SERVICE" \
  --region="$REGION" \
  --sort-by=~metadata.creationTimestamp
```

**トラフィックを最新の Ready リビジョンに 100% 寄せる**（タグ付きプレビューや分割配信の残りに注意）:

```bash
LATEST=$(gcloud run revisions list \
  --service="$SERVICE" \
  --region="$REGION" \
  --filter="status.conditions.type=Ready,status.conditions.status=True" \
  --format='value(metadata.name)' \
  --sort-by=~metadata.creationTimestamp \
  --limit=1)

gcloud run services update-traffic "$SERVICE" \
  --region="$REGION" \
  --to-revisions="${LATEST}=100"
```

デプロイされているイメージ:

```bash
gcloud run services describe "$SERVICE" \
  --region="$REGION" \
  --format='value(spec.template.spec.containers[0].image)'
```

### C. Firestore：インデックスとクエリの不一致

1. **Firebase Console** → Firestore → **インデックス** で、エラーメッセージや `firestore.indexes.json` にある定義と一致する **複合インデックス**が **有効（構築完了）**か確認する。
   - リンク付きエラーなら、その URL から作成するのが確実。
2. CLI でデプロイする場合（認証が通る端末のみ）:

```bash
cd <リポジトリルート>
# 401 が続くときは一度: unset GOOGLE_APPLICATION_CREDENTIALS
firebase logout && firebase login --reauth
npx firebase-tools@13.35.1 deploy --only firestore:indexes --project "$PROJECT_ID" --non-interactive
```

**インデックスは構築に数分かかる**ことがある。作成直後は同じ 500 が続く場合がある。

### D. GitHub Actions

- `main` への push で **Firestore インデックスデプロイ**がワークフローに含まれる。失敗する場合は **デプロイ用 SA の権限**（Firebase / Firestore インデックス管理）を確認する。
- ワークフロー成功後も、**Cloud Run のトラフィック**が意図したリビジョンを向いているかは別途 `gcloud` で確認する。

---

## Check（評価：直ったか・原因は確定したか）

- 同じ `curl` / ブラウザ操作で **ステータスと本文が期待どおり**か。
- **`GET /api/config`** で `buildSha` があれば、**マージしたコミット SHA** と一致するか（新イメージが本番に載った確認）。
- Firestore 関連なら、コンソールで該当インデックスが **Enabled** か。
- 再発防止のため、**チケットやメモに「根本原因」と「実施したコマンド（マスク済み）」**を残す。

---

## Act（改善：次に同じ迷いを減らす）

1. **CI**: インデックスデプロイを「黙ってスキップ」しない（権限がないと失敗するようにし、早く気づく）。
2. **可観測性**: 本番イメージとコミットの対応が分かる情報（例: `/api/config` の `buildSha`）を維持する。
3. **ドキュメント**: 本プレイブックを更新する（新しい典型エラーパターンが出たら **Plan の表**と **Do** に追記）。
4. **コード**: Firestore で `orderBy` と複合条件を増やす変更をしたら、**必ず `firestore.indexes.json` とデプロイ手順**をセットでレビューする。

---

## 今回の事例からの教訓（要約）

- **500 + Firestore インデックスエラー**は、「インデックス未作成」と「古いコンテナが古いクエリを投げている」の **両方**を疑う。
- **シークレットモード**はクライアント側のキャッシュ対策には有効だが、**Cloud Run / Firestore の状態は変えない**。
- **`firebase deploy` の 401** は `firebase login` だけでは足りず、`GOOGLE_APPLICATION_CREDENTIALS` の干渉やトークン再取得が必要なことがある。
