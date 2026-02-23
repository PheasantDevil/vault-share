# GCP IaC: TypeScript（Pulumi） vs その他（Terraform 等）

## 目的

「フルTypeScriptで進める。IaC で TypeScript 以外が好ましい部分があればそちらに合わせる」という方針に基づき、GCP の IaC ツールを比較する。

## 比較概要

| 観点           | Pulumi (TypeScript)                        | Terraform (HCL)                       |
| -------------- | ------------------------------------------ | ------------------------------------- |
| 言語           | TypeScript / Python / Go 等                | HCL（専用DSL）                        |
| プログラミング | クラス・関数・ループ・条件をそのまま使用   | count / for_each 等のワークアラウンド |
| IDE            | 型チェック・オートコンプリート・リファクタ | プラグインで補完                      |
| ライセンス     | Apache 2.0（OSS）                          | BSL（実質 OSS ではない）              |
| シークレット   | デフォルトで暗号化                         | Vault 等の外部ツールが必要な場合あり  |
| GCP 新機能     | ネイティブ連携が早い傾向                   | コミュニティプロバイダ依存            |
| 採用実績       | 増加傾向                                   | 業界で最も多い                        |

## 結論・提案

- **TypeScript を活かしつつ GCP を IaC する**: **Pulumi（TypeScript）** を推奨。
  - アプリと同一言語でインフラを書けるため、型の共有やロジックの再利用がしやすい。
  - 少人数・単一プロダクトでは「HCL を別途習得するより、TS 一本で統一」の方がコスパが良い。
- **「TypeScript 以外が好ましい」ケース**: 特になし。Terraform の方がよいのは「既存の Terraform 資産がある」「運用チームが HCL に慣れている」場合であり、本プロジェクトは新規のため Pulumi + TypeScript で問題ない。
- **実装方針**: GCP の IaC は **Pulumi（TypeScript）** で実装する。リポジトリ内の `infra/` または `packages/infra` に Pulumi プロジェクトを配置する想定。

## 参照

- [Pulumi vs Terraform](https://www.pulumi.com/docs/iac/comparisons/terraform/)
- [Building Reusable GCP Infrastructure with Pulumi & TypeScript](https://pulore.com/blog/infrastructure-as-code-pulumi-gcp)
- env0, Pulumi 公式の比較記事
