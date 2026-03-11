# MFA SMS認証の完全実装計画

## 1. 要件の整理

| 項目                | 内容                                                                          |
| ------------------- | ----------------------------------------------------------------------------- |
| **SMS MFA登録**     | Identity Platform の SMS を利用して電話番号を登録。reCAPTCHA認証が必要。      |
| **SMS MFAログイン** | ログイン時にSMSが有効な場合は、SMSコード入力画面を表示。reCAPTCHA認証が必要。 |
| **無料枠**          | 1日10通まで無料。超過時はTOTPを推奨するメッセージを表示。                     |

## 2. コンポーネント設計

| コンポーネント/層          | 役割                                                          | Props / State 等                                      |
| -------------------------- | ------------------------------------------------------------- | ----------------------------------------------------- |
| **MFA設定ページ（SMS）**   | SMS登録フロー（reCAPTCHA、電話番号入力、SMS送信、コード検証） | reCAPTCHA状態、電話番号、検証コード、エラーメッセージ |
| **MFAログイン画面（SMS）** | SMSログイン認証フロー（reCAPTCHA、SMS送信、コード検証）       | reCAPTCHA状態、検証コード、エラーメッセージ           |

## 3. データ設計・状態管理

- **Identity Platform**: SMS MFAの登録・検証は Identity Platform の API を使用
- **reCAPTCHA**: Firebase Auth の reCAPTCHA v3 を使用（ブラウザ側で実装）
- **セッション**: SMS検証済みの ID トークンでセッションを発行

## 4. 実装順序

1. **reCAPTCHA設定の確認**（Firebase ConsoleでreCAPTCHA設定が有効か確認）
2. **SMS登録フローの実装**（設定ページの`startEnrollSms`関数を完成）
3. **SMSログイン認証フローの実装**（ログインページのPhone認証を完成）

## 5. 懸念事項・エッジケース

| 懸念                | 対策                                                            |
| ------------------- | --------------------------------------------------------------- |
| **SMSの無料枠超過** | 1日10通まで無料。超過時はTOTPを推奨するメッセージを表示。       |
| **reCAPTCHAの設定** | Firebase ConsoleでreCAPTCHA設定を有効化する必要がある。         |
| **電話番号の形式**  | E.164形式（例: +81-90-1234-5678）を推奨。バリデーションを実装。 |
| **SMS送信の失敗**   | エラーハンドリングを実装し、適切なエラーメッセージを表示。      |

## 6. 実装詳細

### 6.1 SMS登録フロー（設定ページ）

1. ユーザーが「SMSで登録」ボタンをクリック
2. reCAPTCHAを初期化（`RecaptchaVerifier`）
3. 電話番号を入力
4. 「送信」ボタンをクリック → `PhoneAuthProvider.verifyPhoneNumber`を呼び出し
5. SMSコードが送信される
6. ユーザーがコードを入力
7. 「検証」ボタンをクリック → `PhoneMultiFactorGenerator.assertionForEnrollment`で検証
8. `multiFactor(user).enroll`で登録完了

### 6.2 SMSログイン認証フロー（ログインページ）

1. ログイン時にMFAエラーが発生
2. `getMultiFactorResolver`でresolverを取得
3. `resolver.hints[0].factorId === 'phone'`の場合、SMS認証フローを開始
4. reCAPTCHAを初期化
5. `PhoneAuthProvider.verifyPhoneNumber`でSMSを送信
6. ユーザーがコードを入力
7. `PhoneMultiFactorGenerator.assertionForSignIn`で検証
8. `resolver.resolveSignIn`でログイン完了

## 7. 参考ドキュメント

- Firebase Auth SMS MFA: https://firebase.google.com/docs/auth/web/multi-factor
- Identity Platform無料枠: `docs/01-research/04-identity-platform-free-tier-mfa.md`
