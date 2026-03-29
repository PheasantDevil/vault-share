import type { ItemPayload } from './types';
import { normalizeItemPayloadFromRequest } from './normalize-item-payload';

/** CSV/1PUX の ParsedItem を暗号化前の ItemPayload に確定する */
export function finalizeParsedItemForStorage(p: {
  title: string;
  type: ItemPayload['type'];
  value: string;
  note?: string;
  detailTemplate?: ItemPayload['detailTemplate'];
  detailFields?: Record<string, string>;
}): ItemPayload {
  if (p.detailTemplate && p.detailTemplate !== 'generic' && p.detailFields) {
    const n = normalizeItemPayloadFromRequest({
      title: p.title,
      detailTemplate: p.detailTemplate,
      detailFields: p.detailFields,
      note: p.note,
    });
    if (n.ok) {
      return n.payload;
    }
  }
  return {
    title: p.title,
    type: p.type,
    value: p.value,
    note: p.note,
  };
}
