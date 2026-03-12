# レスポンシブデザイン・アクセシビリティ改善実装計画

## 1. 要件の整理

### 1.1 レスポンシブデザイン

| 項目 | 内容 |
|------|------|
| **モバイル対応** | 320px〜768pxでのレイアウト最適化 |
| **タブレット対応** | 768px〜1024pxでのレイアウト最適化 |
| **タッチ操作** | ボタンサイズ、タップ領域の最適化 |
| **ナビゲーション** | モバイルメニューの実装 |

### 1.2 アクセシビリティ

| 項目 | 内容 |
|------|------|
| **ARIA属性** | 適切なARIA属性の追加 |
| **キーボードナビゲーション** | すべての操作をキーボードで実行可能に |
| **スクリーンリーダー** | 適切なラベル、説明の追加 |
| **コントラスト比** | WCAG 2.1 AA準拠（4.5:1以上） |
| **フォーカス表示** | 明確なフォーカスインジケーター |

---

## 2. コンポーネント設計

### 2.1 レスポンシブデザイン

#### 2.1.1 ブレークポイント定義

```typescript
const breakpoints = {
  mobile: '320px',
  tablet: '768px',
  desktop: '1024px',
};
```

#### 2.1.2 共通スタイルの改善

| コンポーネント | 改善内容 |
|---------------|----------|
| **PageLayout** | モバイルでの最大幅調整、パディング最適化 |
| **FormField** | モバイルでの入力フィールドサイズ調整 |
| **Button** | タッチ操作に適した最小サイズ（44x44px） |
| **Table** | モバイルでの横スクロール対応 |
| **Navigation** | モバイルメニューの実装 |

### 2.2 アクセシビリティ

#### 2.2.1 ARIA属性の追加

| 要素 | ARIA属性 |
|------|----------|
| **フォーム** | `aria-label`, `aria-describedby`, `aria-invalid` |
| **ボタン** | `aria-label`, `aria-pressed` (トグルボタン) |
| **ナビゲーション** | `aria-label`, `aria-current` |
| **アラート** | `role="alert"`, `aria-live` |
| **テーブル** | `aria-label`, `aria-describedby` |

#### 2.2.2 キーボードナビゲーション

| 機能 | 実装内容 |
|------|----------|
| **フォーカス管理** | タブ順序の最適化、スキップリンクの追加 |
| **モーダル** | フォーカストラップ、ESCキーで閉じる |
| **ドロップダウン** | 矢印キーで操作可能に |
| **フォーム** | Enterキーで送信、適切なフォーカス移動 |

---

## 3. データ設計・状態管理

### 3.1 レスポンシブ状態

```typescript
interface ResponsiveState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}
```

### 3.2 アクセシビリティ設定

```typescript
interface AccessibilitySettings {
  reducedMotion: boolean;
  highContrast: boolean;
}
```

---

## 4. 懸念事項・エッジケース・パフォーマンス

| 懸念 | 対策 |
|------|------|
| **パフォーマンス** | CSS-in-JSの最適化、メディアクエリの効率化 |
| **ブラウザ互換性** | ベンダープレフィックスの追加、フォールバック |
| **テスト** | アクセシビリティテストツールの使用（axe-core等） |
| **デザインの一貫性** | デザインシステムの確立 |

---

## 5. 実装順序

1. **共通スタイルの改善**
   - ブレークポイント定義
   - グローバルスタイルの追加（CSS変数、リセット）
   - レスポンシブユーティリティの作成

2. **UIコンポーネントの改善**
   - PageLayoutのレスポンシブ対応
   - FormFieldのレスポンシブ対応
   - Buttonのタッチ操作最適化
   - Tableのモバイル対応

3. **ナビゲーションの改善**
   - モバイルメニューの実装
   - スキップリンクの追加

4. **アクセシビリティの改善**
   - ARIA属性の追加
   - キーボードナビゲーションの改善
   - フォーカス表示の改善
   - コントラスト比の確認・改善

5. **ページ単位の改善**
   - 各ページのレスポンシブ対応
   - アクセシビリティの確認・改善

---

## 6. 実装詳細

### 6.1 共通スタイル

**ファイル:**
- `apps/web/src/styles/globals.css` - グローバルスタイル、CSS変数
- `apps/web/src/styles/responsive.css` - レスポンシブユーティリティ

### 6.2 UIコンポーネントの改善

**ファイル:**
- `apps/web/src/components/ui/PageLayout.tsx` - レスポンシブ対応
- `apps/web/src/components/ui/FormField.tsx` - レスポンシブ対応
- `apps/web/src/components/ui/Button.tsx` - タッチ操作最適化
- `apps/web/src/components/ui/Table.tsx` - モバイル対応（新規）

### 6.3 ナビゲーション

**ファイル:**
- `apps/web/src/components/Navigation.tsx` - モバイルメニュー実装
- `apps/web/src/components/SkipLink.tsx` - スキップリンク（新規）

### 6.4 アクセシビリティ

**ファイル:**
- `apps/web/src/lib/accessibility/` - アクセシビリティユーティリティ（新規）

---

## 7. 参考資料

- WCAG 2.1: [Web Content Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- Next.js Accessibility: [Next.js Accessibility](https://nextjs.org/docs/app/building-your-application/accessibility)
- CSS Media Queries: [MDN Media Queries](https://developer.mozilla.org/en-US/docs/Web/CSS/Media_Queries)
