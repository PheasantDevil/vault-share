/**
 * アイテム操作のE2Eテスト
 */
import { test, expect } from '@playwright/test';

test.describe('Item Operations', () => {
  test.beforeEach(async ({ page }) => {
    // ログイン（事前にユーザーとグループが存在することを前提）
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
  });

  test('should create a new item', async ({ page }) => {
    // グループ詳細ページに移動（グループIDは事前に作成されていることを前提）
    // 実際のテストでは、グループを作成してからそのIDを使用
    await page.goto('/dashboard');

    // 最初のグループをクリック（存在する場合）
    const groupLink = page.locator('a[href^="/dashboard/groups/"]').first();
    if ((await groupLink.count()) > 0) {
      await groupLink.click();
      await page.waitForURL(/\/dashboard\/groups\/[^/]+$/);

      // アイテム作成フォームを開く
      await page.click('text=/新しいアイテムを追加/');

      // フォームに入力
      await page.fill('input[type="text"]', 'Test Item');
      await page.selectOption('select', 'password');
      await page.fill('textarea', 'test-value');

      // 保存
      await page.click('button[type="submit"]');

      // アイテムが表示されることを確認
      await expect(page.locator('text=Test Item')).toBeVisible();
    }
  });
});
