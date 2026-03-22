import path from 'path';

/**
 * リポジトリ直下の `docs/` ディレクトリ（`apps/web` から見て `../..`）
 */
export function getDocsRootAbsolute(): string {
  return path.resolve(process.cwd(), '..', '..', 'docs');
}
