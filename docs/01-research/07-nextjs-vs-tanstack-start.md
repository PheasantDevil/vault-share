# Next.js と TanStack Start の比較検証（置き換え要否）

## 1. 調査のきっかけ

[Zenn: Next.jsはもう要らない？次世代フレームワークTanstack Startに入門してみた](https://zenn.dev/ashunar0/articles/8c6cbedde44a89) を踏まえ、本プロジェクト（vault-share）で Next.js を TanStack Start に置き換えるべきか、および置き換える場合に同時に変更すべきサービス・ツールを検証する。

---

## 2. TanStack Start の概要

- **TanStack Start**: TanStack Router を基盤にしたフルスタックフレームワーク。**Vite 上で動作**し、SSR・SSG・SPA に対応。
- **思想の違い**（記事より）:
  - **Next.js** = オートマ車。乗れば走るが中身は暗黙。
  - **TanStack Start** = マニュアル車。ルーティング・loader・サーバー関数を明示的に書く。
- **主な特徴**:
  - **型安全ルーティング**: `routeTree.gen.ts` で有効なパスが型になり、`<Link to="/abuot">` のようなタイポがコンパイルエラーになる。
  - **loader の型伝播**: サーバーで取得したデータの型が `Route.useLoaderData()` まで自動で伝播。
  - **createServerFn**: サーバー関数を明示的に定義。ミューテーション後は `router.invalidate()` で loader の再取得を指示。
- **公式ホスティング**: Cloudflare Workers / Netlify / Railway を推奨。**Node.js・Docker でもデプロイ可能**（Cloud Run に Docker で載せる事例あり）。
- **リリース状況**: 2025 年 9 月に **v1 RC**。安定版直前だが、まだ RC であり API の微調整やドキュメント整備が続いている。

---

## 3. Next.js と TanStack Start の比較（本プロジェクト観点）

| 観点                          | Next.js                                  | TanStack Start                                                          |
| ----------------------------- | ---------------------------------------- | ----------------------------------------------------------------------- |
| **成熟度**                    | 安定版・採用事例・ドキュメントが豊富     | v1 RC。今後も小さな変更の可能性                                         |
| **ビルド**                    | Next.js 独自（Webpack/Turbopack）        | **Vite**。 dev 起動・HMR が速い                                         |
| **ルーティング**              | ファイルベース（App Router）、暗黙       | ファイルベース + **型安全**（TanStack Router）、明示                    |
| **データ取得**                | Server Components 内で fetch、境界が暗黙 | **loader** で明示、型がクライアントまで伝播                             |
| **サーバー処理**              | Server Actions                           | **createServerFn**（同様の役割）                                        |
| **GCP・Cloud Run**            | 公式クイックスタート・事例が多い         | Docker 経由でデプロイ可能だが、手順は自前寄り                           |
| **認証（Identity Platform）** | 日本語・英語のサンプル・ブログが多い     | 汎用 React として自前統合が必要                                         |
| **パッケージマネージャ**      | pnpm / npm / yarn どれでも可             | **同様に pnpm 利用可**（Vite はビルドツールのため pnpm と排他ではない） |

---

## 4. 「置き換える場合に同時に変更すべきもの」の整理

- **pnpm → Vite にするか**: **しない**。
  - **pnpm** はパッケージマネージャ（依存関係のインストール・モノレポのワークスペース）。
  - **Vite** はビルドツール・開発サーバー（Next.js の代わりにアプリをバンドルする役割）。
  - TanStack Start に置き換える場合は「**Next.js をやめて Vite ベースの TanStack Start にする**」であり、**pnpm はそのまま**利用する（モノレポのルートも pnpm のまま）。
  - 変更になるのは **apps/web のフレームワーク（Next.js → TanStack Start）とビルド（Next のビルド → Vite ビルド）** のみ。

- **同時に検討すべき点**:
  - **ランタイム**: TanStack Start の Cloud Run デプロイ事例では **Bun** を使っているものが多い。Node でも可。Bun を採用する場合は `Dockerfile` や CI のランタイムを Node から Bun に変える必要がある。
  - **CI**: `pnpm build` の実体が `vite build` に変わる。Cloud Run 向けの Docker ビルド・デプロイ手順は、Next.js 用から TanStack Start（Node または Bun サーバー）用に書き換える必要がある。
  - **デプロイ形態**: 現状方針の「Cloud Run にコンテナでデプロイ」はそのまま利用可能。出力されるサーバー（`.output/server` など）をコンテナ内で実行する形になる。

---

## 5. 置き換えた方がよいか（結論）

**現時点では置き換えず、Next.js のまま進める**ことを推奨する。

### 5.1 理由

1. **成熟度・リスク**: TanStack Start は v1 RC。本番運用を始める段階では、安定版・ドキュメント・検索しやすい情報量の点で Next.js の方が有利。
2. **GCP との組み合わせ**: Cloud Run・Identity Platform・Firestore との連携は、Next.js の方が事例・クイックスタートが多く、初期構築の手間が小さい。
3. **プロジェクトの性質**: ログイン前提のダッシュボード的 UI であり、型安全ルーティングや loader の型伝播はメリットになるが、**必須ではない**。現状の Next.js でも実装可能。
4. **Zenn 記事の結論との一致**: 記事では「不特定多数に見せるプロダクト（SEO・OGP）→ Next.js」「仕組みを理解してフルコントロールしたい → TanStack Start」としている。vault-share はログイン後が主だが、認証フロー・GCP 連携の確実さを優先するなら Next.js の方が無難。

### 5.2 置き換えを検討するタイミング

- TanStack Start が **v1 安定版** になり、GCP / Identity Platform まわりの事例やブログが増えた段階。
- 型安全ルーティング・明示的 loader による開発効率や保守性を、チームで優先したいと判断した場合。
- その際も **pnpm は維持**し、変更するのは **apps/web のフレームワーク（Next.js → TanStack Start）とビルド（Vite）・必要に応じてランタイム（Bun）** とする。

---

## 6. 参照

- [Zenn: Next.jsはもう要らない？次世代フレームワークTanstack Startに入門してみた](https://zenn.dev/ashunar0/articles/8c6cbedde44a89)
- [TanStack Start - Hosting (React)](https://tanstack.com/start/latest/docs/framework/react/hosting)
- [TanStack Start vs Next.js（公式比較）](https://tanstack.com/start/latest/docs/framework/react/start-vs-nextjs)
- [TanStack Start v1 Release Candidate 発表](https://tanstack.com/blog/announcing-tanstack-start-v1)
- [Deploying TanStack Start on Cloud Run with Docker + Bun (Medium)](https://medium.com/@chadbell045/deploying-tanstack-start-on-cloud-run-with-docker-bun-d4e66c246557)
- 本リポジトリ: `docs/01-research/01-frontend-framework-comparison.md`（設計前のフレームワーク比較）
