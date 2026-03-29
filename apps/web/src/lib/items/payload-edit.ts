import type { ItemPayload, ItemType } from './types';
import { initialEmptyFieldsForTemplate } from './template-definitions';

export type EditFormState =
  | {
      mode: 'structured';
      title: string;
      note: string;
      detailTemplate: 'login' | 'credit_card' | 'bank_account';
      detailFields: Record<string, string>;
    }
  | {
      mode: 'generic';
      title: string;
      note: string;
      type: ItemType;
      value: string;
    };

/** 保存用の API ボディ（normalize が受け取れる形） */
export function editFormStateToRequestBody(s: EditFormState): Record<string, unknown> {
  if (s.mode === 'structured') {
    return {
      title: s.title.trim(),
      note: s.note.trim() || undefined,
      detailTemplate: s.detailTemplate,
      detailFields: s.detailFields,
    };
  }
  return {
    title: s.title.trim(),
    type: s.type,
    value: s.value,
    note: s.note.trim() || undefined,
  };
}

/** 詳細表示中の payload から編集フォーム初期値を作る */
export function itemPayloadToEditFormState(payload: ItemPayload): EditFormState {
  if (payload.detailTemplate && payload.detailTemplate !== 'generic' && payload.detailFields) {
    const tid = payload.detailTemplate as 'login' | 'credit_card' | 'bank_account';
    return {
      mode: 'structured',
      title: payload.title,
      note: payload.note ?? '',
      detailTemplate: tid,
      detailFields: {
        ...initialEmptyFieldsForTemplate(tid),
        ...payload.detailFields,
      },
    };
  }

  if (payload.type === 'password' && payload.value.trim().startsWith('{')) {
    try {
      const j = JSON.parse(payload.value) as {
        website?: string;
        username?: string;
        password?: string;
      };
      return {
        mode: 'structured',
        title: payload.title,
        note: payload.note ?? '',
        detailTemplate: 'login',
        detailFields: {
          ...initialEmptyFieldsForTemplate('login'),
          website: j.website ?? '',
          username: j.username ?? '',
          password: j.password ?? '',
        },
      };
    } catch {
      /* fallthrough */
    }
  }

  return {
    mode: 'generic',
    title: payload.title,
    note: payload.note ?? '',
    type: payload.type,
    value: payload.value,
  };
}
