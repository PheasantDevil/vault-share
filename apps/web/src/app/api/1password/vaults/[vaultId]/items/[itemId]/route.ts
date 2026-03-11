/**
 * GET: 1Password Connect アイテム詳細を取得
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/get-session';
import { OnePasswordConnectClient } from '@/lib/1password/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { vaultId: string; itemId: string } }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const connectUrl = process.env.ONEPASSWORD_CONNECT_URL;
    const accessToken = process.env.ONEPASSWORD_CONNECT_TOKEN;

    if (!connectUrl || !accessToken) {
      return NextResponse.json(
        { error: '1Password Connect設定がありません。管理者に連絡してください。' },
        { status: 500 }
      );
    }

    const client = new OnePasswordConnectClient({ connectUrl, accessToken });
    const item = await client.getItem(params.vaultId, params.itemId);

    return NextResponse.json({ item });
  } catch (err) {
    console.error('1Password Connect item error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'アイテム詳細の取得に失敗しました' },
      { status: 500 }
    );
  }
}
