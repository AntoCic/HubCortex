import {
  FirestoreModel,
  normalizeTiptapHtml,
  toColorTagArray,
  type ColorTag,
  type Timestampble,
} from 'cic-kit';

function normalizeString(value: unknown, maxLength = 180) {
  const normalized = String(value ?? '').trim();
  if (!normalized) return '';
  return normalized.slice(0, maxLength);
}

function normalizeContent(value: unknown) {
  return normalizeTiptapHtml(value);
}

function normalizeTags(value: unknown) {
  const normalized = toColorTagArray(value);
  if (!normalized.length) return undefined;
  return normalized.slice(0, 30);
}

export interface NoteData extends Partial<Timestampble> {
  id: string;
  title: string;
  content: string;
  tag?: ColorTag[];
  updateBy: string;
}

export class Note extends FirestoreModel<NoteData> {
  static collectionName = 'notes';

  title: string;
  content: string;
  tag?: ColorTag[];
  updateBy: string;

  constructor(data: NoteData) {
    super(data);
    this.title = normalizeString(data.title, 180);
    this.content = normalizeContent(data.content);
    this.tag = normalizeTags(data.tag);
    this.updateBy = normalizeString(data.updateBy, 120) || 'system';
  }

  toData(): NoteData {
    return {
      id: this.id,
      title: normalizeString(this.title, 180),
      content: normalizeContent(this.content),
      tag: normalizeTags(this.tag),
      updateBy: normalizeString(this.updateBy, 120) || 'system',
      ...this.timestampbleProps(),
    };
  }
}
