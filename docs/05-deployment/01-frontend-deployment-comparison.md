# フロントエンド（Next.js）デプロイ先の比較と提案

## 1. 現状の確認

### 1.1 デプロイ先の定義状況

| 項目               | 現状                                                                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| **設計書での記載** | `docs/02-design/00-architecture-and-requirements.md` で **GCP Cloud Run** に Next.js をデプロイする想定（想定リソース・CI/CD 方針）。 |
| **実装状況**       | **デプロイ先は未設定**。CI（`.github/workflows/ci.yml`）は lint / build / test のみで、デプロイステップはない。                       |
| **サイト確認方法** | 本番デプロイが未構築のため、**ローカルの `pnpm dev` でしか確認できない**。                                                            |

結論: **デプロイ先は設計上 Cloud Run を想定しているが未実装であり、運用上の「ここにデプロイして確認する」は決まっていない。**

### 1.2 方針の決定（GCP 統一）

**インフラを GCP に統一するメリット**を優先し、フロントエンドのデプロイ先を **Cloud Run** に決定した。Firestore・Secret Manager・Identity Platform と同じ GCP プロジェクトで運用し、認証・環境変数・ネットワークを一元化する。

- 無料枠・課金の整理: [02-cloud-run-free-tier-and-preview.md](02-cloud-run-free-tier-and-preview.md)
- プレビュー URL（PR ごとの確認用 URL）方針: 上記ドキュメントの「プレビュー URL の代替案」を参照。**案 A（PR 時に Cloud Run へプレビュー用リビジョンをデプロイし、PR コメントに URL を投稿）** で固定する。

---

## 2. 候補サービスの比較（参考）（2024–2025 年頃の傾向）

最近よく使われるフロント／フルスタックのデプロイ先として、以下を比較する。

| サービス             | 主な用途               | Next.js 対応               | 無料枠の特徴                                                                               |
| -------------------- | ---------------------- | -------------------------- | ------------------------------------------------------------------------------------------ |
| **Vercel**           | フロント・Next.js 特化 | ◎ 公式・零設定             | 200 プロジェクト、6,000 分/月ビルド、Serverless 12 本/デプロイ、10 秒タイムアウト（Hobby） |
| **Netlify**          | JAMstack・フロント     | ○ 対応強化                 | 100 GB 転送、ビルド分は縮小傾向、Pro 有料                                                  |
| **Cloudflare Pages** | エッジ・静的〜SSR      | ○ OpenNext で Next 対応    | **無制限帯域**、500 分ビルド、Docker 対応（2026）                                          |
| **GCP Cloud Run**    | コンテナ・フルスタック | ○ 公式クイックスタートあり | 無料枠（リクエスト・実行時間に上限）、GCP 他サービスと一体化                               |

### 2.1 Vercel

- **メリット**
  - Next.js の開発元が提供しており、App Router・Server Components・Server Actions の対応が早く、零設定に近い。
  - GitHub 連携で push または PR から自動デプロイ・プレビュー URL が発行され、**サイト確認が簡単**。
  - 他プロジェクトでも利用している場合、手順・運用が統一できる。
  - 無料枠で **プロジェクト数は 200** まで（Hobby）。プロジェクト数上限に引っかかる可能性は低い。
- **デメリット**
  - **Serverless Function は 1 デプロイあたり 12 本まで**（Hobby）。Next.js の API Routes / Server Actions が多数になると制限に当たる可能性がある。
  - **関数の実行タイムアウトが 10 秒**（Hobby）。長時間かかる処理（大きな CSV インポートなど）は別設計が必要。
  - バックエンド（Firestore・Secret Manager・Identity Platform）は GCP のため、**GCP と Vercel の二軸**になる（環境変数・認証の管理は必要）。
  - 帯域・ビルド分を超えると有料。Pro は $20/ユーザ・月。

### 2.2 Netlify

- **メリット**: フレームワーク非依存、プラグインが豊富、Next 対応も改善。
- **デメリット**: 無料枠が縮小傾向、Next.js は Vercel ほど最適化されていない。本プロジェクトは Next 中心のため、Vercel の方が扱いやすい。

### 2.3 Cloudflare Pages

- **メリット**: 無料帯域が無制限、エッジが強く TTFB が短い、OpenNext で Next 対応が進んでいる。
- **デメリット**: Next.js の一部機能で制約がある場合がある。GCP（Firestore 等）と組み合わせる構成は Vercel と同様に二軸になる。

### 2.4 GCP Cloud Run

- **メリット**: Firestore・Secret Manager・Identity Platform と同じ GCP 内に収まり、**インフラを GCP に統一**できる。実行時間が長い処理（最大 60 分など）に向く。既存の Pulumi（GCP）と組みやすい。
- **デメリット**: コンテナビルド・レジストリ・デプロイの設定が必要で、**Vercel より初期構築と運用の手間が大きい**。Next.js 特化の自動最適化はない。

---

## 3. Vercel 利用のメリット・デメリット整理

### 3.1 メリット

- Next.js との相性が良く、**設定が少なくサイトをすぐ確認**できる。
- GitHub 連携で **PR ごとのプレビュー URL** が得られ、レビューしやすい。
- 他開発でも Vercel を使っている場合、**手順・画面が共通**で運用しやすい。
- 無料枠で **プロジェクト数 200** まで。個人・少人数ではプロジェクト数上限に当たりにくい。

### 3.2 デメリット・注意点

- **Serverless 12 本/デプロイ（Hobby）**: API Routes や Server Actions が増えると制限に当たる。必要なら Pro や、重い処理は GCP 側に寄せる設計にする。
- **10 秒タイムアウト（Hobby）**: 大きなファイルのインポートなど長時間処理は、非同期ジョブや GCP 側に逃がす必要がある。
- **GCP との二軸**: 認証・DB・Secret は GCP。Vercel の環境変数に GCP の設定（プロジェクト ID、Secret 参照など）を入れる必要がある。
- **無料枠を超えた場合**: ビルド分・帯域で有料。Pro は $20/ユーザ・月。

---

## 4. 提案（採用済み）

- **フロントエンドのデプロイ先は Cloud Run** とする（GCP 統一のため）。Vercel は採用しない。
- 無料枠・課金の整理およびプレビュー URL 方針は [02-cloud-run-free-tier-and-preview.md](02-cloud-run-free-tier-and-preview.md) に記載した。

---

## 5. 参照

- [Vercel - Limits](https://vercel.com/docs/limits/overview)
- [Vercel - Hobby Plan](https://vercel.com/docs/accounts/plans/hobby)
- [Vercel vs Netlify vs Cloudflare Pages 比較](https://www.devtoolreviews.com/reviews/vercel-vs-netlify-vs-cloudflare-pages-2026)
- [Next.js on Google Cloud Run](https://cloud.google.com/run/docs/quickstarts/frameworks/deploy-nextjs-service)
