import path from 'path';

/**
 * リポジトリ直下の `docs/` ディレクトリ（`apps/web` から見て `../..`）
 */
export function getDocsRootAbsolute(): string {
  return path.resolve(process.cwd(), '..', '..', 'docs');
}

/**
 * docs の slug（posix・拡張子なし）から `/docs/...` の URL パスを返す
 */
export function docsHrefFromSlug(slug: string): string {
  return '/docs/' + slug.split('/').map(encodeURIComponent).join('/');
}
