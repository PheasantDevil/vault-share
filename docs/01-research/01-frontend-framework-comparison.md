# フロントエンドフレームワーク比較（設計前調査）

## 目的

フルTypeScript・GCP構成において、Next.js で進めてよいか、あるいは近年注目のフレームワークで実装チャレンジする候補を検討する。

## 調査結果サマリ（2024–2025）

| フレームワーク | 言語/基盤 | 特徴                                      | バンドル・パフォーマンス | 採用目安                |
| -------------- | --------- | ----------------------------------------- | ------------------------ | ----------------------- |
| **Next.js**    | React     | 業界標準、App Router・RSC・Server Actions | RSC によりやや重め       | 求人・エコシステム・SEO |
| **Nuxt 3**     | Vue       | エッジTTFB、Layersでマルチサイト再利用    | 中程度バンドル           | Vue チーム向け          |
| **SvelteKit**  | Svelte    | ビルド時コンパイル、最小バンドル          | 96 Lighthouse, 15KB      | パフォーマンス・軽量UI  |
| **Astro**      | マルチ    | アイランドアーキテクチャ、静的優先        | 99 Lighthouse, 5KB       | SEO・コンテンツサイト   |
| **Remix**      | React     | データローディング・ムーダル              | 中程度                   | フォーム・データ中心UI  |
| **SolidStart** | SolidJS   | 生のパフォーマンス最優先                  | 42.8 ops/sec, 28ms       | パフォーマンス重視      |

## トレンド（2024–2025）

- **Server Functions / Server Actions**: Next.js Server Actions、React 19 Server Functions、Astro Actions、SolidStart など、ブラウザから型安全にサーバー関数を呼ぶパターンが一般化。
- **ハイブリッドレンダリング**: ルート/コンポーネント単位のプリレンダリングが主流。
- **バンドル削減**: Astro / SvelteKit は Next.js + RSC よりインタラクティブバンドルを小さくしやすい。

## 本プロジェクト向け提案

- **推奨**: **Next.js（App Router）** のまま進める。
  - 理由: フルTypeScript、GCP・バックエンドとの統合、認証（Identity Platform）との組み合わせの情報が多く、少人数チーム・初期リリースのリスクを抑えやすい。
- **チャレンジ候補**: 実装コストを抑えつつ「最近のフレームワーク」を試すなら **SvelteKit**。
  - TypeScript ネイティブ、バンドルが軽く、Server Functions も利用可能。機密情報を扱うダッシュボードのようなUIに適する。
- **採用しない理由（現時点）**: Astro は静的・コンテンツ向け、Remix はフォーム中心の構成で本サービスの中核（認証・CRUD・1Password連携）とは相性がやや異なる。Nuxt は Vue のため、他を React/TS で統一する方針と合わせるなら Next.js の方が一貫する。

## 参照

- [Nuxt vs Next.js vs Astro vs SvelteKit (2026)](https://www.nunuqs.com/blog/nuxt-vs-next-js-vs-astro-vs-sveltekit-2026-frontend-framework-showdown)
- [Modern Web Frameworks Comparison 2026](https://mivibzzz.com/resources/web-development/modern-web-frameworks-comparison)
- [Remix vs. Next.js vs. SvelteKit](https://blog.logrocket.com/react-remix-vs-next-js-vs-sveltekit/)
- Netlify, FrontendTools 等の 2024–2025 年次レビュー
