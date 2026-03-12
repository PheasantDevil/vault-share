/**
 * SWR設定
 */
import { SWRConfiguration } from 'swr';

export const swrConfig: SWRConfiguration = {
  revalidateOnFocus: false, // フォーカス時の再検証を無効化（パフォーマンス向上）
  revalidateOnReconnect: true, // 再接続時の再検証を有効化
  dedupingInterval: 2000, // 2秒間の重複リクエストを防ぐ
  errorRetryCount: 3, // エラー時のリトライ回数
  errorRetryInterval: 5000, // リトライ間隔（5秒）
  keepPreviousData: true, // データ更新時に前のデータを保持
};
