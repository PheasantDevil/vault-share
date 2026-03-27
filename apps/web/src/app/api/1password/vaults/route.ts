/**
 * GET: 1Password Connect vault一覧を取得
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/get-session';
import { OnePasswordConnectClient } from '@/lib/1password/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1Password Connect設定を取得（環境変数またはユーザー設定から）
    // 現時点では環境変数から取得（将来的にはユーザーごとの設定に変更）
    const connectUrl = process.env.ONEPASSWORD_CONNECT_URL;
    const accessToken = process.env.ONEPASSWORD_CONNECT_TOKEN;

    if (!connectUrl || !accessToken) {
      return NextResponse.json(
        { error: '1Password Connect設定がありません。管理者に連絡してください。' },
        { status: 500 }
      );
    }

    const client = new OnePasswordConnectClient({ connectUrl, accessToken });
    const vaults = await client.listVaults();

    return NextResponse.json({ vaults: vaults ?? [] });
  } catch (err) {
    console.error('1Password Connect vaults error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Vault一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}
