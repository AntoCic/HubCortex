import {
  FirestoreModel,
  normalizeTiptapHtml,
  toColorTagArray,
  type ColorTag,
  type Timestampble,
} from 'cic-kit';

function normalizeString(value: unknown, maxLength = 240) {
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

export interface CmdData extends Partial<Timestampble> {
  id: string;
  title: string;
  command: string;
  description?: string;
  tag?: ColorTag[];
  updateBy: string;
}

export class Cmd extends FirestoreModel<CmdData> {
  static collectionName = 'cmd';

  title: string;
  command: string;
  description?: string;
  tag?: ColorTag[];
  updateBy: string;

  constructor(data: CmdData) {
    super(data);
    this.title = normalizeString(data.title, 180);
    this.command = normalizeString(data.command, 600);
    this.description = data.description ? normalizeContent(data.description) : undefined;
    this.tag = normalizeTags(data.tag);
    this.updateBy = normalizeString(data.updateBy, 120) || 'system';
  }

  toData(): CmdData {
    return {
      id: this.id,
      title: normalizeString(this.title, 180),
      command: normalizeString(this.command, 600),
      description: this.description ? normalizeContent(this.description) : undefined,
      tag: normalizeTags(this.tag),
      updateBy: normalizeString(this.updateBy, 120) || 'system',
      ...this.timestampbleProps(),
    };
  }
}
