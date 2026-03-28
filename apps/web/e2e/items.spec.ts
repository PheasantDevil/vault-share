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
    // ダッシュボードの先頭リンクは /dashboard/groups/new のため、必ずグループを新規作成してから詳細へ進む
    const groupName = `E2E Item ${Date.now()}`;
    await page.goto('/dashboard/groups/new');
    await page.fill('input[type="text"]', groupName);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard\/groups\/[^/]+$/);
    await expect(page.locator('h1')).toContainText(groupName);

    // アイテム作成フォームを開く
    await page.getByRole('button', { name: /新しいアイテムを追加/ }).click();

    // フォームに入力（一覧の検索・フィルタ用 select とは区別する）
    await page.getByLabel('タイトル').fill('Test Item');
    await page.getByLabel('種別').selectOption('password');
    await page.getByLabel('内容').fill('test-value');

    // 保存
    await page.getByRole('button', { name: '保存' }).click();

    // アイテムが表示されることを確認
    await expect(page.getByText('Test Item')).toBeVisible();
  });
});
