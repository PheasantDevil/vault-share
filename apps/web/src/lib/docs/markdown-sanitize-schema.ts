import { defaultSchema } from 'rehype-sanitize';

/**
 * rehype-slug が付与する見出し `id` を sanitize 後も残す（default と明示マージ）
 */
const HEADINGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const;

export const docsMarkdownSanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    ...Object.fromEntries(
      HEADINGS.map((tag) => {
        const cur = defaultSchema.attributes?.[tag];
        const list = Array.isArray(cur) ? [...cur] : [];
        if (!list.includes('id')) {
          list.push('id');
        }
        return [tag, list];
      })
    ),
  },
};
