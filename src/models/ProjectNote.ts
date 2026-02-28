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

export interface ProjectNoteData extends Partial<Timestampble> {
  id: string;
  projectId: string;
  title: string;
  content: string;
  tag?: ColorTag[];
  updateBy: string;
}

export class ProjectNote extends FirestoreModel<ProjectNoteData> {
  static collectionName = 'projectNotes';

  projectId: string;
  title: string;
  content: string;
  tag?: ColorTag[];
  updateBy: string;

  constructor(data: ProjectNoteData) {
    super(data);
    this.projectId = normalizeString(data.projectId, 120);
    this.title = normalizeString(data.title, 180);
    this.content = normalizeContent(data.content);
    this.tag = normalizeTags(data.tag);
    this.updateBy = normalizeString(data.updateBy, 120) || 'system';
  }

  toData(): ProjectNoteData {
    return {
      id: this.id,
      projectId: normalizeString(this.projectId, 120),
      title: normalizeString(this.title, 180),
      content: normalizeContent(this.content),
      tag: normalizeTags(this.tag),
      updateBy: normalizeString(this.updateBy, 120) || 'system',
      ...this.timestampbleProps(),
    };
  }
}
