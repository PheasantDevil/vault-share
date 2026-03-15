/**
 * E2Eテスト用の認証ユーザーをFirebase Auth Emulatorに作成する
 * test-e2e ワークフローで、アプリ起動前に実行する
 */
import { setupTestEnv } from '../src/test/integration/helpers/setup-test-env';
import { createTestUser } from '../src/test/integration/helpers/test-data';

const E2E_TEST_EMAIL = 'test@example.com';
const E2E_TEST_PASSWORD = 'password123';

async function main() {
  await setupTestEnv();
  await createTestUser(E2E_TEST_EMAIL, E2E_TEST_PASSWORD);
  console.log(`E2E test user created: ${E2E_TEST_EMAIL}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
