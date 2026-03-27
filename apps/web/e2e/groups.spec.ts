/**
 * グループ操作のE2Eテスト
 */
import { test, expect } from '@playwright/test';

test.describe('Group Operations', () => {
  test.beforeEach(async ({ page }) => {
    // ログイン（事前にユーザーが存在することを前提）
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
  });

  test('should create a new group', async ({ page }) => {
    await page.goto('/dashboard/groups/new');

    // グループ名を入力
    await page.fill('input[type="text"]', 'Test Group');
    await page.click('button[type="submit"]');

    // グループ詳細ページにリダイレクトされることを確認
    await expect(page).toHaveURL(/\/dashboard\/groups\/[^/]+$/);
    await expect(page.locator('h1')).toContainText('Test Group');
  });

  test('should display group list on dashboard', async ({ page }) => {
    await page.goto('/dashboard');

    // グループ一覧が表示されることを確認（「グループ」単独だとツールバーの「グループを作成」と重複する）
    await expect(page.getByText('参加中のグループ一覧')).toBeVisible();
  });
});
