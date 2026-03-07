# Identity Platform / Firebase Auth 無料枠と MFA

## 目的

Google Identity Platform を「無料の範囲」で使い、MFA を初期実装に含められるか確認する。

## 結論サマリ

- **Identity Platform**: 0〜49,999 MAU は **無料**（Tier 1: メール・ソーシャル・匿名・電話）。
- **MFA**: Identity Platform では **利用可能**。無料枠の MAU 制限内であれば MFA 機能自体に追加料金はかからない。
- **SMS MFA**: 1 日あたり **先頭 10 通まで無料**、以降は送信先地域に応じて従量課金（約 $0.01–$0.43/通）。
- **少人数チーム**: 数十 MAU かつ SMS を多用しなければ、実質 **無料で Identity Platform + MFA** を利用可能。

## 詳細（Identity Platform 料金）

- Tier 1（メール/ソーシャル/匿名/電話）: 0–49,999 MAU → **$0**。
- 50,000 MAU 以上: $0.0055/MAU 等の従量料金。
- 保存されているがその月にアクティブでないユーザーは MAU にカウントされない。
- SMS: 1 日 10 通まで無料、以降は地域別単価。

## Firebase Auth のみの場合

- Firebase Auth の無料枠には **MFA は含まれない**。MFA を使うには **Identity Platform にアップグレード** する必要がある。
- Identity Platform にすると、上記の MAU ベースの無料枠が適用される。

## 本プロジェクトへの反映

- **認証**: Google Cloud **Identity Platform** を採用し、無料枠（0–49,999 MAU）で運用。
- **MFA**: 初期実装に **含める**。SMS は 1 日 10 通まで無料のため、少人数であればコスト増を抑えられる。TOTP（アプリベース 2FA）も利用可能であればコストゼロで提供可能。
- **プロバイダ**: メール/パスワードのみを Tier 1 の範囲で実装（Google 等のソーシャルログインは使用しない。ログインは許可されたメールアドレスのみ）。

## 参照

- [Identity Platform pricing](https://cloud.google.com/identity-platform/pricing)
- [Identity Platform quotas and limits](https://cloud.google.com/identity-platform/quotas)
- Firebase Auth と Identity Platform の違い（公式ドキュメント）
