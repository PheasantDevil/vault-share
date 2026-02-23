# 1Password Connect 無料枠・料金

## 目的

1Password 連携の「A: インポート/エクスポート」と「B: Connect API によるリアルタイム連携」のうち、B を無料枠で実装可能か確認する。

## 用語

- **Vault access credit**: Connect 経由で 1Password の vault にアクセスするための単位。1 クレジット = 1 トークンが 1 つの vault にアクセスする権限。
- **Secrets Automation**: 1Password のシークレット自動化製品。Connect サーバーを利用する場合、クレジットベースの課金が適用されることがある。

## 料金・無料枠（要約）

- **無料枠**: **3 vault access credits** まで無料。
- 有料: $29/月（25 クレジット）、$99/月（100）、$299/月（500）等。
- **補足**: 1Password の**サブスクリプション**に「Connect の無制限利用」が含まれるという記述もあり、利用形態（当サービス側で立てる Connect サーバー vs ユーザー自身の 1Password アカウント）によって解釈が分かれる。本設計では「当サービスが Connect サーバーを立て、ユーザーが 1Password の vault を連携する」前提で、**3 クレジット無料**を前提に計画する。

## 本プロジェクトへの反映

- **初期（A）**: 1Password のエクスポート（CSV/1PUX 等）のインポートと、当サービスから 1Password 形式へのエクスポートを実装。**Connect 不要・無料**。
- **強化（B）**: 1Password Connect Server API で vault を参照し、アイテムを選択して当サービスに登録する機能を実装する場合、**3 vault まで無料**。少人数チームが 1 チーム 1 vault 程度であれば、無料枠内で収まる可能性が高い。
- **注意**: 利用形態（自前 Connect サーバー vs 1Password 提供の Connect）によって課金が異なる可能性があるため、実装前に 1Password の最新料金・利用規約を再確認すること。

## 参照

- [1Password Connect](https://developer.1password.com/docs/connect/)
- [About Secrets Automation billing](https://support.1password.com/secrets-automation-billing/)
- [Pricing for 1Password Connect (Community)](https://1password.community/discussions/1password/pricing-for-1password-connect/152787)
