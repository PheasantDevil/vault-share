# セキュリティ強化実装計画

## 1. 要件の整理

### 1.1 セキュリティヘッダの設定

| 項目                                      | 内容                         |
| ----------------------------------------- | ---------------------------- |
| **CSP (Content Security Policy)**         | XSS攻撃対策                  |
| **HSTS (HTTP Strict Transport Security)** | HTTPS強制                    |
| **X-Frame-Options**                       | クリックジャッキング対策     |
| **X-Content-Type-Options**                | MIMEタイプスニッフィング対策 |
| **Referrer-Policy**                       | リファラー情報の制御         |

### 1.2 レート制限の実装

| 項目                        | 内容                                 |
| --------------------------- | ------------------------------------ |
| **APIエンドポイント**       | IPアドレスベースのレート制限         |
| **ログイン試行**            | ブルートフォース対策（試行回数制限） |
| **インポート/エクスポート** | 大量リクエストの制限                 |

### 1.3 セッション管理の改善

| 項目                       | 内容                         |
| -------------------------- | ---------------------------- |
| **セッションタイムアウト** | 30分、1時間等の設定          |
| **セッション無効化**       | 全デバイスからログアウト機能 |
| **セッション一覧**         | アクティブセッションの表示   |

---

## 2. コンポーネント設計

### 2.1 セキュリティヘッダ

#### 2.1.1 Next.js設定

**ファイル:**

- `apps/web/next.config.js` - セキュリティヘッダの設定

```typescript
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value:
      "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;",
  },
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
];
```

### 2.2 レート制限

#### 2.2.1 レート制限ミドルウェア

**ファイル:**

- `apps/web/src/lib/rate-limit/` - レート制限ユーティリティ

```typescript
interface RateLimitConfig {
  windowMs: number; // 時間窓（ミリ秒）
  maxRequests: number; // 最大リクエスト数
  keyGenerator?: (request: NextRequest) => string; // キー生成関数
}
```

#### 2.2.2 Firestoreベースのレート制限

Firestoreを使用してレート制限を実装（Redisの代替）

### 2.3 セッション管理

#### 2.3.1 セッションタイムアウト

**ファイル:**

- `apps/web/src/lib/auth/session.ts` - セッションタイムアウト設定

#### 2.3.2 セッション無効化API

**ファイル:**

- `apps/web/src/app/api/auth/sessions/route.ts` - セッション一覧・無効化API

---

## 3. データ設計・状態管理

### 3.1 レート制限データ

```typescript
interface RateLimitDoc {
  key: string; // IPアドレスまたはユーザーID
  count: number;
  resetAt: string; // ISO 8601
}
```

### 3.2 セッション管理データ

```typescript
interface SessionDoc {
  sessionId: string;
  userId: string;
  createdAt: string;
  lastAccessedAt: string;
  ipAddress?: string;
  userAgent?: string;
}
```

---

## 4. 懸念事項・エッジケース・パフォーマンス

| 懸念                       | 対策                                              |
| -------------------------- | ------------------------------------------------- |
| **Firestoreの無料枠超過**  | レート制限データのTTL設定、定期的なクリーンアップ |
| **パフォーマンス**         | レート制限チェックの最適化、キャッシュの活用      |
| **ユーザー体験**           | レート制限時の適切なエラーメッセージ              |
| **セッション管理の複雑さ** | シンプルな実装を優先                              |

---

## 5. 実装順序

1. **セキュリティヘッダの設定**
   - Next.js設定ファイルの更新
   - CSPポリシーの調整

2. **レート制限の実装**
   - レート制限ミドルウェアの実装
   - ログインAPIへの適用
   - インポート/エクスポートAPIへの適用

3. **セッション管理の改善**
   - セッションタイムアウト設定
   - セッション無効化機能
   - セッション一覧API

---

## 6. 実装詳細

### 6.1 セキュリティヘッダ

**ファイル:**

- `apps/web/next.config.js` - セキュリティヘッダ設定

### 6.2 レート制限

**ファイル:**

- `apps/web/src/lib/rate-limit/index.ts` - レート制限ユーティリティ
- `apps/web/src/middleware.ts` - レート制限ミドルウェアの統合

### 6.3 セッション管理

**ファイル:**

- `apps/web/src/lib/auth/session.ts` - セッションタイムアウト設定
- `apps/web/src/app/api/auth/sessions/route.ts` - セッション管理API

---

## 7. 参考資料

- Next.js Security Headers: [Next.js Security Headers](https://nextjs.org/docs/app/api-reference/next-config-js/headers)
- OWASP Security Headers: [OWASP Secure Headers](https://owasp.org/www-project-secure-headers/)
