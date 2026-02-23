# 機密情報保存の暗号化ベストプラクティス（設計前調査）

## 目的

「暗号化の要件は特になし。設計時にどのレベルでの実装が好ましいか提案してほしい」に応えるため、OWASP 等のベストプラクティスを整理する。

## 前提

- 対象: ログインID・パスワード・銀行情報・API キー等の機密データ。
- 地域: 海外ユーザーも想定。

## 推奨レベル（優先度順）

### 1. パスワードの扱い

- **可逆暗号化でパスワードを保存しない**。パスワードは **ハッシュ**（bcrypt / Argon2 等）で保存する。本サービスで「共有するパスワード」は「ユーザーが登録する秘密の文字列」なので、**アプリケーション層で対称暗号（AES-256 等）で暗号化して保存**し、復号鍵は認証済みユーザーのみがアクセスできるようにする。

### 2. 保存データの暗号化（At Rest）

- **推奨**: **アプリケーション層での暗号化**（フィールド単位 or レコード単位で AES-256 等）。
  - 理由: DB が漏洩しても、アプリの鍵がなければ復号できない。GCP のディスク暗号化だけでは、DB にアクセスできればデータが見える。
- **鍵管理**: 暗号化鍵は **GCP Secret Manager** 等で保持し、アプリ起動時に読み込む。鍵のローテーション方針を設計に含める。
- **アルゴリズム**: AES-256（GCM 等の認証付きモード）を推奨（OWASP Cryptographic Storage Cheat Sheet）。

### 3. 転送時の暗号化（In Transit）

- **必須**: すべての通信は **TLS 1.2 以上**（HTTPS）。GCP のロードバランサ・Cloud Run 等はデフォルトで対応。

### 4. アクセス制御・監査

- **最小権限**: 認証済みユーザーのみが「自分がアクセス権を持つ」機密項目を閲覧・編集できるようにする。
- **監査ログ**: 機密データの参照・作成・更新・削除をログに残し、GCP のログging と連携する。

### 5. クライアント側暗号化（オプション）

- 「サーバーは暗号化済みバイト列しか扱わない」方式は、エンドツーエンドで秘密を守れるが、検索・共有・1Password 連携の実装が複雑になる。**初期段階では必須としない**。将来の強化で検討可能。

## 本プロジェクトへの提案

- **初期実装**: (1) パスワードはハッシュ、(2) 機密項目の本体（タイトル・URL・ユーザー名・パスワード・メモ等）は **アプリケーション層で AES-256 暗号化**して DB に保存、(3) 転送は TLS、(4) 鍵は Secret Manager、(5) アクセス制御と監査ログを実装する。
- **DB のみの暗号化**: GCP のデフォルトディスク暗号化は有効にするが、「それだけ」に頼らず、上記アプリ層暗号化を併用する。

## 参照

- [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [GCP Secret Manager best practices](https://cloud.google.com/secret-manager/docs/best-practices)
