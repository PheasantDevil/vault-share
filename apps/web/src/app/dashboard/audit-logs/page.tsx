'use client';

/**
 * 監査ログ一覧ページ
 */
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { PageLayout } from '@/components/ui/PageLayout';
import { Pagination } from '@/components/ui/Pagination';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { useToast } from '@/components/ui/Toast';
import type { AuditLogDoc } from '@vault-share/db';
import { useEffect, useState } from 'react';

interface AuditLogFilters {
  groupId?: string;
  actorUid?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
}

interface AuditLogResponse {
  logs: AuditLogDoc[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AuditLogFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [totalItems, setTotalItems] = useState(0);
  const { showToast } = useToast();

  const loadLogs = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters.groupId) params.append('groupId', filters.groupId);
      if (filters.actorUid) params.append('actorUid', filters.actorUid);
      if (filters.action) params.append('action', filters.action);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      params.append('limit', itemsPerPage.toString());
      params.append('offset', ((currentPage - 1) * itemsPerPage).toString());
      params.append('sortBy', 'createdAt');
      params.append('sortOrder', 'desc');

      const response = await fetch(`/api/audit-logs?${params.toString()}`);
      if (response.status === 403) {
        const body = await response.json().catch(() => ({}));
        const msg =
          body?.error?.message ??
          '監査ログを閲覧する権限がありません（グループのオーナーのみ閲覧できます）';
        throw new Error(msg);
      }
      if (!response.ok) {
        throw new Error('監査ログの取得に失敗しました');
      }

      const data: AuditLogResponse = await response.json();
      setLogs(data.logs);
      setTotalItems(data.pagination.total);
    } catch (err) {
      const message = err instanceof Error ? err.message : '監査ログの取得に失敗しました';
      setError(message);
      showToast('error', message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [currentPage, filters]);

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.groupId) params.append('groupId', filters.groupId);
      if (filters.actorUid) params.append('actorUid', filters.actorUid);
      if (filters.action) params.append('action', filters.action);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await fetch(`/api/audit-logs/export?${params.toString()}`);
      if (!response.ok) {
        const ct = response.headers.get('content-type');
        if (ct?.includes('application/json')) {
          const body = await response.json().catch(() => ({}));
          throw new Error(
            body?.error?.message ?? 'エクスポートに失敗しました（権限を確認してください）'
          );
        }
        throw new Error('エクスポートに失敗しました');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      showToast('success', '監査ログをエクスポートしました');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'エクスポートに失敗しました';
      showToast('error', message);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP');
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      'group.create': 'グループ作成',
      'group.updateName': 'グループ名更新',
      'group.delete': 'グループ削除',
      'member.add': 'メンバー追加',
      'member.changeRole': 'メンバー権限変更',
      'member.remove': 'メンバー削除',
      'item.create': 'アイテム作成',
      'item.update': 'アイテム更新',
      'item.delete': 'アイテム削除',
      'auth.login': 'ログイン',
      'auth.loginFailed': 'ログイン失敗',
      'auth.logout': 'ログアウト',
      'auth.unauthorizedAccess': '不正アクセス',
    };
    return labels[action] || action;
  };

  return (
    <PageLayout title="監査ログ" description="システムの操作履歴を確認できます">
      {error && <Alert type="error">{error}</Alert>}

      <div className="space-y-6">
        {/* フィルタ */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">フィルタ</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">操作種別</label>
              <select
                className="w-full px-3 py-2 border rounded-md"
                value={filters.action || ''}
                onChange={(e) => setFilters({ ...filters, action: e.target.value || undefined })}
              >
                <option value="">すべて</option>
                <option value="group.create">グループ作成</option>
                <option value="group.updateName">グループ名更新</option>
                <option value="group.delete">グループ削除</option>
                <option value="member.add">メンバー追加</option>
                <option value="member.changeRole">メンバー権限変更</option>
                <option value="member.remove">メンバー削除</option>
                <option value="item.create">アイテム作成</option>
                <option value="item.update">アイテム更新</option>
                <option value="item.delete">アイテム削除</option>
                <option value="auth.login">ログイン</option>
                <option value="auth.loginFailed">ログイン失敗</option>
                <option value="auth.logout">ログアウト</option>
                <option value="auth.unauthorizedAccess">不正アクセス</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">開始日</label>
              <input
                type="date"
                className="w-full px-3 py-2 border rounded-md"
                value={filters.startDate || ''}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value || undefined })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">終了日</label>
              <input
                type="date"
                className="w-full px-3 py-2 border rounded-md"
                value={filters.endDate || ''}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value || undefined })}
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={handleExport}>CSVエクスポート</Button>
          </div>
        </div>

        {/* ログテーブル */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <SectionHeader title={`監査ログ (${totalItems}件)`} />
          {loading ? (
            <SkeletonLoader rows={5} />
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">監査ログがありません</div>
          ) : (
            <>
              <div
                className="table-responsive"
                style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}
              >
                <table
                  className="w-full"
                  role="table"
                  aria-label="監査ログ一覧"
                  aria-describedby="audit-logs-description"
                >
                  <caption id="audit-logs-description" className="sr-only">
                    システムの操作履歴を表示するテーブル
                  </caption>
                  <thead style={{ backgroundColor: '#f9f9f9' }}>
                    <tr>
                      <th
                        scope="col"
                        style={{
                          padding: '0.75rem 1rem',
                          textAlign: 'left',
                          fontSize: 'var(--font-size-xs, 0.75rem)',
                          fontWeight: 500,
                          color: 'var(--text-secondary, #666)',
                          textTransform: 'uppercase',
                        }}
                      >
                        日時
                      </th>
                      <th
                        scope="col"
                        style={{
                          padding: '0.75rem 1rem',
                          textAlign: 'left',
                          fontSize: 'var(--font-size-xs, 0.75rem)',
                          fontWeight: 500,
                          color: 'var(--text-secondary, #666)',
                          textTransform: 'uppercase',
                        }}
                      >
                        操作
                      </th>
                      <th
                        scope="col"
                        style={{
                          padding: '0.75rem 1rem',
                          textAlign: 'left',
                          fontSize: 'var(--font-size-xs, 0.75rem)',
                          fontWeight: 500,
                          color: 'var(--text-secondary, #666)',
                          textTransform: 'uppercase',
                        }}
                      >
                        ユーザーID
                      </th>
                      <th
                        scope="col"
                        style={{
                          padding: '0.75rem 1rem',
                          textAlign: 'left',
                          fontSize: 'var(--font-size-xs, 0.75rem)',
                          fontWeight: 500,
                          color: 'var(--text-secondary, #666)',
                          textTransform: 'uppercase',
                        }}
                      >
                        グループID
                      </th>
                      <th
                        scope="col"
                        style={{
                          padding: '0.75rem 1rem',
                          textAlign: 'left',
                          fontSize: 'var(--font-size-xs, 0.75rem)',
                          fontWeight: 500,
                          color: 'var(--text-secondary, #666)',
                          textTransform: 'uppercase',
                        }}
                      >
                        IPアドレス
                      </th>
                      <th
                        scope="col"
                        style={{
                          padding: '0.75rem 1rem',
                          textAlign: 'left',
                          fontSize: 'var(--font-size-xs, 0.75rem)',
                          fontWeight: 500,
                          color: 'var(--text-secondary, #666)',
                          textTransform: 'uppercase',
                        }}
                      >
                        セキュリティ
                      </th>
                    </tr>
                  </thead>
                  <tbody style={{ borderTop: '1px solid var(--border-color, #ddd)' }}>
                    {logs.map((log) => (
                      <tr
                        key={log.id}
                        style={{
                          borderBottom: '1px solid var(--border-color, #ddd)',
                          transition: 'background-color 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f9f9f9';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <td
                          style={{
                            padding: '0.75rem 1rem',
                            fontSize: 'var(--font-size-sm, 0.875rem)',
                          }}
                        >
                          {formatDate(log.createdAt)}
                        </td>
                        <td
                          style={{
                            padding: '0.75rem 1rem',
                            fontSize: 'var(--font-size-sm, 0.875rem)',
                          }}
                        >
                          {getActionLabel(log.action)}
                        </td>
                        <td
                          style={{
                            padding: '0.75rem 1rem',
                            fontSize: 'var(--font-size-xs, 0.75rem)',
                            fontFamily: 'monospace',
                          }}
                        >
                          {log.actorUid.substring(0, 8)}...
                        </td>
                        <td
                          style={{
                            padding: '0.75rem 1rem',
                            fontSize: 'var(--font-size-xs, 0.75rem)',
                            fontFamily: 'monospace',
                          }}
                        >
                          {log.groupId.substring(0, 8)}...
                        </td>
                        <td
                          style={{
                            padding: '0.75rem 1rem',
                            fontSize: 'var(--font-size-sm, 0.875rem)',
                          }}
                        >
                          {log.ipAddress || '-'}
                        </td>
                        <td
                          style={{
                            padding: '0.75rem 1rem',
                            fontSize: 'var(--font-size-sm, 0.875rem)',
                          }}
                        >
                          {log.securityEvent ? (
                            <span
                              style={{ color: '#c00', fontWeight: 600 }}
                              aria-label="セキュリティイベント"
                            >
                              ⚠️
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t">
                <Pagination
                  currentPage={currentPage}
                  totalPages={Math.ceil(totalItems / itemsPerPage)}
                  onPageChange={setCurrentPage}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
