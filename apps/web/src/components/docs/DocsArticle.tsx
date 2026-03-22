import Markdown from 'react-markdown';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeSanitize from 'rehype-sanitize';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';
import { docsMarkdownSanitizeSchema } from '@/lib/docs/markdown-sanitize-schema';
import styles from './docs.module.css';

type Props = {
  markdown: string;
};

/**
 * サーバーで Markdown を HTML に変換（GFM・見出しアンカー・サニタイズ）
 */
export function DocsArticle({ markdown }: Props) {
  return (
    <article className={styles.prose}>
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: 'wrap' }],
          [rehypeSanitize, docsMarkdownSanitizeSchema],
        ]}
      >
        {markdown}
      </Markdown>
    </article>
  );
}
