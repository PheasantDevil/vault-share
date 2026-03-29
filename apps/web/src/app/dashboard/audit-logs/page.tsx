'use client';

/**
 * 監査ログ一覧（カード型フィード。モバイルでも横スクロールなしで閲覧しやすい）
 */
import Link from 'next/link';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { PageLayout } from '@/components/ui/PageLayout';
import { Pagination } from '@/components/ui/Pagination';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { useToast } from '@/components/ui/Toast';
import type { AuditLogDoc } from '@vault-share/db';
import {
  AUDIT_ACTION_FILTER_OPTIONS,
  formatLogDateParts,
  getActionCategory,
  getActionLabel,
  shortId,
  type AuditActionCategory,
} from '@/lib/audit-logs/ui';
import { useCallback, useEffect, useRef, useState } from 'react';

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

type MeGroup = { id: string; name: string; role: string };

function badgeClass(cat: AuditActionCategory): string {
  return `audit-badge audit-badge--${cat}`;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AuditLogFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [totalItems, setTotalItems] = useState(0);
  const [ownerGroups, setOwnerGroups] = useState<MeGroup[]>([]);
  /** 実行者 UID は入力中に毎回ページを戻さないようデバウンス */
  const [actorUidDraft, setActorUidDraft] = useState('');
  const actorDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    setCurrentPage(1);
  }, [filters.actorUid]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.groups) return;
        setOwnerGroups(data.groups.filter((g: MeGroup) => g.role === 'owner'));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const patchFilters = useCallback((patch: Partial<AuditLogFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    setCurrentPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({});
    setActorUidDraft('');
    setCurrentPage(1);
  }, []);

  useEffect(() => {
    setActorUidDraft(filters.actorUid ?? '');
  }, [filters.actorUid]);

  useEffect(() => {
    if (actorDebounceRef.current) clearTimeout(actorDebounceRef.current);
    actorDebounceRef.current = setTimeout(() => {
      const next = actorUidDraft.trim() || undefined;
      setFilters((prev) => {
        if ((prev.actorUid ?? undefined) === next) return prev;
        return { ...prev, actorUid: next };
      });
    }, 450);
    return () => {
      if (actorDebounceRef.current) clearTimeout(actorDebounceRef.current);
    };
  }, [actorUidDraft]);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters.groupId) params.append('groupId', filters.groupId);
      if (filters.actorUid?.trim()) params.append('actorUid', filters.actorUid.trim());
      if (filters.action) params.append('action', filters.action);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      params.append('limit', itemsPerPage.toString());
      params.append('offset', ((currentPage - 1) * itemsPerPage).toString());
      params.append('sortBy', 'createdAt');
      params.append('sortOrder', 'desc');

      const response = await fetch(`/api/audit-logs?${params.toString()}`);
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        const msg =
          body?.error?.message ??
          (response.status === 403
            ? '監査ログを閲覧する権限がありません（グループのオーナーのみ閲覧できます）'
            : '監査ログの取得に失敗しました');
        throw new Error(msg);
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
  }, [currentPage, filters, itemsPerPage, showToast]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.groupId) params.append('groupId', filters.groupId);
      if (filters.actorUid?.trim()) params.append('actorUid', filters.actorUid.trim());
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

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      showToast('success', 'コピーしました');
    } catch {
      showToast('error', 'コピーに失敗しました');
    }
  }

  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  return (
    <PageLayout
      title="監査ログ"
      description="グループに関する操作の記録です。時系列で確認し、必要に応じて CSV に出力できます。"
      maxWidth={960}
    >
      {error && <Alert type="error">{error}</Alert>}

      <div className="audit-page">
        <section className="audit-panel" aria-labelledby="audit-filters-heading">
          <h2 id="audit-filters-heading" className="audit-panel__title">
            絞り込み
          </h2>
          <p className="audit-panel__hint">
            オーナーとして管理するグループのログのみ表示されます。オーナーグループが 31
            件を超える場合は、一覧取得時にグループを指定してください。
          </p>

          <div className="audit-filter-grid">
            <div className="audit-field">
              <label htmlFor="audit-filter-group">グループ</label>
              <select
                id="audit-filter-group"
                value={filters.groupId ?? ''}
                onChange={(e) => patchFilters({ groupId: e.target.value || undefined })}
              >
                <option value="">すべて</option>
                {ownerGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name || g.id}
                  </option>
                ))}
              </select>
            </div>
            <div className="audit-field">
              <label htmlFor="audit-filter-action">操作</label>
              <select
                id="audit-filter-action"
                value={filters.action ?? ''}
                onChange={(e) => patchFilters({ action: e.target.value || undefined })}
              >
                <option value="">すべて</option>
                {AUDIT_ACTION_FILTER_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="audit-field">
              <label htmlFor="audit-filter-actor">実行者 UID（完全一致）</label>
              <input
                id="audit-filter-actor"
                type="text"
                autoComplete="off"
                placeholder="入力後、少し待つと反映されます"
                value={actorUidDraft}
                onChange={(e) => setActorUidDraft(e.target.value)}
              />
            </div>
            <div className="audit-field">
              <label htmlFor="audit-filter-start">開始日</label>
              <input
                id="audit-filter-start"
                type="date"
                value={filters.startDate ?? ''}
                onChange={(e) => patchFilters({ startDate: e.target.value || undefined })}
              />
            </div>
            <div className="audit-field">
              <label htmlFor="audit-filter-end">終了日</label>
              <input
                id="audit-filter-end"
                type="date"
                value={filters.endDate ?? ''}
                onChange={(e) => patchFilters({ endDate: e.target.value || undefined })}
              />
            </div>
          </div>

          <div className="audit-toolbar">
            <Button type="button" variant="primary" onClick={handleExport}>
              CSV にエクスポート
            </Button>
            <Button type="button" variant="secondary" onClick={resetFilters}>
              条件をクリア
            </Button>
          </div>
        </section>

        <section className="audit-panel" aria-labelledby="audit-feed-heading">
          <div className="audit-feed-header">
            <h2 id="audit-feed-heading">操作履歴</h2>
            <span className="audit-feed-count" aria-live="polite">
              {loading ? '読み込み中…' : `全 ${totalItems} 件`}
            </span>
          </div>

          {loading ? (
            <SkeletonLoader rows={5} />
          ) : logs.length === 0 ? (
            <div className="audit-empty">
              該当するログがありません。
              <br />
              条件を変えるか、期間を広げて再度お試しください。
            </div>
          ) : (
            <>
              <ol className="audit-feed">
                {logs.map((log) => {
                  const cat = getActionCategory(log.action);
                  const { dateLine, timeLine } = formatLogDateParts(log.createdAt);
                  return (
                    <li key={log.id}>
                      <article className="audit-entry" aria-labelledby={`audit-time-${log.id}`}>
                        <div className="audit-entry__header">
                          <div className="audit-entry__when">
                            <span className="audit-entry__date">{dateLine}</span>
                            <span className="audit-entry__time" id={`audit-time-${log.id}`}>
                              {timeLine}
                            </span>
                          </div>
                          <span className={badgeClass(cat)} title={log.action}>
                            {getActionLabel(log.action)}
                          </span>
                        </div>

                        <dl className="audit-kv">
                          <dt>実行者</dt>
                          <dd>
                            <div className="audit-kv__row-actions">
                              <span className="audit-mono">{shortId(log.actorUid)}</span>
                              <button
                                type="button"
                                className="audit-copy-btn"
                                onClick={() => copyToClipboard(log.actorUid)}
                              >
                                コピー
                              </button>
                            </div>
                          </dd>
                          <dt>グループ</dt>
                          <dd>
                            <div className="audit-kv__row-actions">
                              <Link
                                href={`/dashboard/groups/${log.groupId}`}
                                className="app-link audit-mono"
                              >
                                {shortId(log.groupId)}
                              </Link>
                              <button
                                type="button"
                                className="audit-copy-btn"
                                onClick={() => copyToClipboard(log.groupId)}
                              >
                                ID をコピー
                              </button>
                            </div>
                          </dd>
                          {log.itemId ? (
                            <>
                              <dt>アイテム</dt>
                              <dd>
                                <div className="audit-kv__row-actions">
                                  <span className="audit-mono">{shortId(log.itemId)}</span>
                                  <button
                                    type="button"
                                    className="audit-copy-btn"
                                    onClick={() => copyToClipboard(log.itemId!)}
                                  >
                                    コピー
                                  </button>
                                </div>
                              </dd>
                            </>
                          ) : null}
                          <dt>IP</dt>
                          <dd>{log.ipAddress ?? '—'}</dd>
                          <dt>端末</dt>
                          <dd className="audit-mono" style={{ fontSize: 'var(--font-size-xs)' }}>
                            {log.userAgent ? (
                              <span title={log.userAgent}>{shortId(log.userAgent, 24, 12)}</span>
                            ) : (
                              '—'
                            )}
                          </dd>
                        </dl>

                        {log.securityEvent ? (
                          <div className="audit-entry__alert" role="status">
                            セキュリティ関連としてマークされたイベントです。内容を確認してください。
                          </div>
                        ) : null}
                      </article>
                    </li>
                  );
                })}
              </ol>

              <div className="audit-pagination-wrap">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            </>
          )}
        </section>
      </div>
    </PageLayout>
  );
}
