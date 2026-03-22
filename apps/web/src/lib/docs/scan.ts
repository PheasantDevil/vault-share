import fs from 'fs/promises';
import path from 'path';
import { getDocsRootAbsolute } from './paths';

function toPosix(p: string): string {
  return p.split(path.sep).join('/');
}

/**
 * `docs/` 配下の全 .md を列挙し、URL slug（拡張子なし・posix）の配列を返す
 */
export async function getAllDocSlugs(): Promise<string[]> {
  const root = getDocsRootAbsolute();
  const slugs: string[] = [];

  async function walk(dir: string, relDir: string): Promise<void> {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const ent of entries) {
      if (ent.name.startsWith('.')) continue;
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        const nextRel = relDir ? `${relDir}/${ent.name}` : ent.name;
        await walk(full, nextRel);
      } else if (ent.isFile() && ent.name.endsWith('.md')) {
        const base = ent.name.slice(0, -'.md'.length);
        const slug = relDir ? `${toPosix(relDir)}/${base}` : base;
        slugs.push(slug);
      }
    }
  }

  await walk(root, '');
  return slugs.sort((a, b) => a.localeCompare(b));
}

/**
 * slug を検証し、`docs/` 内の .md 絶対パスを返す。不正なら null
 */
export async function resolveMarkdownFilePath(slug: string): Promise<string | null> {
  const segments = slug.split('/').filter(Boolean);
  if (segments.length === 0) return null;
  if (segments.some((s) => s === '..' || s === '.')) return null;

  const root = path.resolve(getDocsRootAbsolute());
  const abs = path.resolve(root, ...segments) + '.md';
  const rel = path.relative(root, abs);
  if (rel.startsWith('..') || path.isAbsolute(rel)) return null;

  try {
    const stat = await fs.stat(abs);
    if (!stat.isFile()) return null;
  } catch {
    return null;
  }
  return abs;
}

export async function readMarkdownSource(slug: string): Promise<string | null> {
  const abs = await resolveMarkdownFilePath(slug);
  if (!abs) return null;
  return fs.readFile(abs, 'utf8');
}
