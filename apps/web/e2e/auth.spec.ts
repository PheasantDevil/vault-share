/**
 * 認証フローのE2Eテスト
 */
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should login and redirect to dashboard', async ({ page }) => {
    await page.goto('/login');

    // ログインフォームに入力
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // ダッシュボードにリダイレクトされることを確認
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // エラーメッセージ（認証失敗は Alert 1 件。strict モード回避のため getByRole を使用）
    await expect(
      page.getByRole('alert', { name: /メールアドレスまたはパスワードが正しくありません/ })
    ).toBeVisible();
  });

  test('should logout and redirect to login', async ({ page }) => {
    // ログイン（事前にユーザーが存在することを前提）
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);

    // ログアウト
    await page.click('text=ログアウト');

    // ログインページにリダイレクトされることを確認
    await expect(page).toHaveURL(/\/login/);
  });
});
