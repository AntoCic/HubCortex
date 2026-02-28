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

export interface ProjectCmdUtilData extends Partial<Timestampble> {
  id: string;
  projectId: string;
  label: string;
  command: string;
  description?: string;
  tag?: ColorTag[];
  updateBy: string;
}

export class ProjectCmdUtil extends FirestoreModel<ProjectCmdUtilData> {
  static collectionName = 'projectCmdUtils';

  projectId: string;
  label: string;
  command: string;
  description?: string;
  tag?: ColorTag[];
  updateBy: string;

  constructor(data: ProjectCmdUtilData) {
    super(data);
    this.projectId = normalizeString(data.projectId, 120);
    this.label = normalizeString(data.label, 180);
    this.command = normalizeString(data.command, 400);
    this.description = data.description ? normalizeContent(data.description) : undefined;
    this.tag = normalizeTags(data.tag);
    this.updateBy = normalizeString(data.updateBy, 120) || 'system';
  }

  toData(): ProjectCmdUtilData {
    return {
      id: this.id,
      projectId: normalizeString(this.projectId, 120),
      label: normalizeString(this.label, 180),
      command: normalizeString(this.command, 400),
      description: this.description ? normalizeContent(this.description) : undefined,
      tag: normalizeTags(this.tag),
      updateBy: normalizeString(this.updateBy, 120) || 'system',
      ...this.timestampbleProps(),
    };
  }
}
