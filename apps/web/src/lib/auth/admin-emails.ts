/**
 * 管理用 API（ブロックリスト操作など）にアクセスできるメール（ADMIN_EMAILS・カンマ区切り）
 */
function parseAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? '';
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminConfigured(): boolean {
  return parseAdminEmails().length > 0;
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const admins = parseAdminEmails();
  if (admins.length === 0) return false;
  return admins.includes(email.trim().toLowerCase());
}
