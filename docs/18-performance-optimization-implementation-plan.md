# パフォーマンス最適化の追加改善実装計画

## 1. 要件の整理

### 1.1 キャッシュ戦略の改善

| 項目                           | 内容                                                   |
| ------------------------------ | ------------------------------------------------------ |
| **APIレスポンスのキャッシュ**  | SWRまたはReact Queryを使用したクライアント側キャッシュ |
| **静的コンテンツのキャッシュ** | Next.jsのキャッシュ設定                                |
| **ブラウザキャッシュの最適化** | Cache-Controlヘッダーの設定                            |

### 1.2 インデックスの最適化

| 項目                      | 内容                                   |
| ------------------------- | -------------------------------------- |
| **Firestoreインデックス** | 複合インデックスの設定                 |
| **クエリパフォーマンス**  | クエリの最適化、不要なデータ取得の削減 |

### 1.3 バッチ処理の改善

| 項目                     | 内容                                 |
| ------------------------ | ------------------------------------ |
| **インポート処理**       | 大量データのチャンク処理、進捗表示   |
| **バッチサイズの最適化** | Firestoreのバッチ制限（500件）を考慮 |

---

## 2. コンポーネント設計

### 2.1 キャッシュ戦略

#### 2.1.1 SWRの導入

**ファイル:**

- `apps/web/src/lib/swr/` - SWR設定とカスタムフック

```typescript
// SWR設定
const swrConfig = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 2000,
};
```

#### 2.1.2 カスタムフック

| フック        | 役割                                 |
| ------------- | ------------------------------------ |
| **useGroups** | グループ一覧の取得（キャッシュ付き） |
| **useGroup**  | グループ詳細の取得（キャッシュ付き） |
| **useItems**  | アイテム一覧の取得（キャッシュ付き） |

### 2.2 インデックス設定

#### 2.2.1 Firestoreインデックス

必要な複合インデックス:

- `groupId` + `createdAt` (降順)
- `groupId` + `type` + `createdAt` (降順)
- `groupId` + `actorUid` + `createdAt` (降順) - 監査ログ用

### 2.3 バッチ処理

#### 2.3.1 インポート処理の改善

**ファイル:**

- `apps/web/src/lib/batch/` - バッチ処理ユーティリティ

```typescript
interface BatchProcessorConfig {
  batchSize: number; // Firestoreの制限（500件）
  onProgress?: (current: number, total: number) => void;
}
```

---

## 3. データ設計・状態管理

### 3.1 キャッシュキー

```typescript
const cacheKeys = {
  groups: '/api/groups',
  group: (id: string) => `/api/groups/${id}`,
  items: (groupId: string) => `/api/groups/${groupId}/items`,
};
```

### 3.2 バッチ処理状態

```typescript
interface BatchProcessState {
  current: number;
  total: number;
  status: 'idle' | 'processing' | 'completed' | 'error';
}
```

---

## 4. 懸念事項・エッジケース・パフォーマンス

| 懸念                      | 対策                                     |
| ------------------------- | ---------------------------------------- |
| **キャッシュの無効化**    | データ更新時のキャッシュ無効化           |
| **Firestoreの無料枠超過** | インデックスの最適化、不要なクエリの削減 |
| **大量データの処理**      | チャンク処理、進捗表示                   |
| **パフォーマンス測定**    | パフォーマンスメトリクスの収集           |

---

## 5. 実装順序

1. **SWRの導入**
   - SWRパッケージのインストール
   - SWR設定の作成
   - カスタムフックの実装

2. **APIルートのキャッシュ設定**
   - Cache-Controlヘッダーの設定
   - Next.jsのキャッシュ設定

3. **Firestoreインデックスの設定**
   - 複合インデックスの作成
   - クエリの最適化

4. **バッチ処理の改善**
   - インポート処理のチャンク処理
   - 進捗表示の追加

---

## 6. 実装詳細

### 6.1 SWRの導入

**ファイル:**

- `apps/web/src/lib/swr/config.ts` - SWR設定
- `apps/web/src/lib/swr/hooks.ts` - カスタムフック

### 6.2 APIルートのキャッシュ設定

**ファイル:**

- `apps/web/src/app/api/groups/route.ts` - Cache-Controlヘッダー追加
- `apps/web/src/app/api/groups/[id]/route.ts` - Cache-Controlヘッダー追加

### 6.3 バッチ処理

**ファイル:**

- `apps/web/src/lib/batch/processor.ts` - バッチ処理ユーティリティ

---

## 7. 参考資料

- SWR: [SWR Documentation](https://swr.vercel.app/)
- Next.js Caching: [Next.js Caching](https://nextjs.org/docs/app/building-your-application/caching)
- Firestore Indexes: [Firestore Indexes](https://cloud.google.com/firestore/docs/query-data/indexes)
