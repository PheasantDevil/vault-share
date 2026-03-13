# 監査ログの拡充・可視化実装計画

## 1. 要件の整理

### 1.1 監査ログの拡充

| 項目                     | 内容                                                   |
| ------------------------ | ------------------------------------------------------ |
| **IPアドレス**           | リクエスト元のIPアドレスを記録                         |
| **ユーザーエージェント** | ブラウザ情報を記録                                     |
| **エラー情報**           | エラー発生時のエラーメッセージ・スタックトレースを記録 |
| **セキュリティイベント** | 不正アクセス試行、認証失敗等を記録                     |

### 1.2 監査ログの可視化

| 項目                   | 内容                                             |
| ---------------------- | ------------------------------------------------ |
| **監査ログ一覧ページ** | `/dashboard/audit-logs` で監査ログを表示         |
| **フィルタリング**     | 日付範囲、ユーザー、操作種別、グループでフィルタ |
| **ソート機能**         | 日時順、ユーザー順等でソート                     |
| **エクスポート機能**   | CSV形式でエクスポート                            |
| **ページネーション**   | 大量ログに対応したページネーション               |

---

## 2. コンポーネント設計

### 2.1 データ設計

#### 2.1.1 AuditLogDocの拡張

```typescript
export interface AuditLogDoc {
  id: string;
  groupId: string;
  itemId?: string | null;
  actorUid: string;
  action: string;
  details?: Record<string, unknown>;
  createdAt: string;
  // 追加フィールド
  ipAddress?: string;
  userAgent?: string;
  error?: {
    message: string;
    code?: string;
    stack?: string;
  };
  securityEvent?: boolean;
}
```

### 2.2 API設計

#### 2.2.1 GET /api/audit-logs

**クエリパラメータ:**

- `groupId` (optional): グループIDでフィルタ
- `actorUid` (optional): ユーザーIDでフィルタ
- `action` (optional): 操作種別でフィルタ
- `startDate` (optional): 開始日時（ISO 8601）
- `endDate` (optional): 終了日時（ISO 8601）
- `limit` (optional): 取得件数（デフォルト: 50）
- `offset` (optional): オフセット（デフォルト: 0）
- `sortBy` (optional): ソート項目（`createdAt`, `actorUid`等、デフォルト: `createdAt`）
- `sortOrder` (optional): ソート順（`asc`, `desc`、デフォルト: `desc`）

**レスポンス:**

```typescript
{
  logs: AuditLogDoc[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}
```

#### 2.2.2 GET /api/audit-logs/export

**クエリパラメータ:**

- 上記と同じフィルタパラメータ

**レスポンス:**

- CSVファイル（`Content-Type: text/csv`）

### 2.3 UI設計

#### 2.3.1 監査ログ一覧ページ

| コンポーネント           | 役割               | Props / State                      |
| ------------------------ | ------------------ | ---------------------------------- |
| **AuditLogsPage**        | 監査ログ一覧ページ | フィルタ状態、ページネーション状態 |
| **AuditLogFilters**      | フィルタUI         | フィルタ値、onChange               |
| **AuditLogTable**        | ログテーブル       | ログデータ、ソート状態             |
| **AuditLogExportButton** | エクスポートボタン | フィルタパラメータ                 |

---

## 3. データ設計・状態管理

### 3.1 フィルタ状態

```typescript
interface AuditLogFilters {
  groupId?: string;
  actorUid?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
}
```

### 3.2 ページネーション状態

```typescript
interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
}
```

---

## 4. 懸念事項・エッジケース・パフォーマンス

| 懸念                           | 対策                                                                   |
| ------------------------------ | ---------------------------------------------------------------------- |
| **Firestoreの無料枠超過**      | インデックス最適化、ページネーション、必要に応じてログの保持期間を設定 |
| **大量ログのパフォーマンス**   | インデックス設定、クエリ最適化、ページネーション                       |
| **IPアドレスの取得**           | Next.jsの`request.headers`から取得（`x-forwarded-for`等を考慮）        |
| **ユーザーエージェントの取得** | `request.headers.get('user-agent')`から取得                            |
| **エラーログの記録**           | エラー発生時に`writeAuditLog`を呼び出し、エラー情報を`details`に含める |
| **セキュリティイベントの記録** | 認証失敗、不正アクセス試行等を`securityEvent: true`で記録              |

---

## 5. 実装順序

1. **監査ログの拡充**
   - `AuditLogDoc`スキーマの拡張
   - `writeAuditLog`関数の拡張（IPアドレス、ユーザーエージェントの取得）
   - エラーログ記録機能の追加
   - セキュリティイベント記録機能の追加

2. **API実装**
   - `GET /api/audit-logs`の実装（フィルタリング、ソート、ページネーション）
   - `GET /api/audit-logs/export`の実装（CSVエクスポート）

3. **UI実装**
   - 監査ログ一覧ページの実装
   - フィルタUIの実装
   - ログテーブルの実装
   - エクスポート機能の実装

4. **インデックス設定**
   - Firestoreインデックスの設定（groupId, actorUid, action, createdAt等）

---

## 6. 実装詳細

### 6.1 監査ログの拡充

**ファイル:**

- `packages/db/src/schema.ts` - AuditLogDocスキーマの拡張
- `apps/web/src/lib/audit/log.ts` - writeAuditLog関数の拡張
- `apps/web/src/lib/audit/request-info.ts` - リクエスト情報取得ヘルパー

### 6.2 API実装

**ファイル:**

- `apps/web/src/app/api/audit-logs/route.ts` - 監査ログ一覧API
- `apps/web/src/app/api/audit-logs/export/route.ts` - CSVエクスポートAPI

### 6.3 UI実装

**ファイル:**

- `apps/web/src/app/dashboard/audit-logs/page.tsx` - 監査ログ一覧ページ
- `apps/web/src/components/audit-logs/AuditLogFilters.tsx` - フィルタUI
- `apps/web/src/components/audit-logs/AuditLogTable.tsx` - ログテーブル

---

## 7. 参考資料

- Firestoreのクエリ最適化: [Firestore Query Optimization](https://cloud.google.com/firestore/docs/query-data/queries)
- Next.js Request Headers: [Next.js Request Headers](https://nextjs.org/docs/app/api-reference/functions/next-request)
