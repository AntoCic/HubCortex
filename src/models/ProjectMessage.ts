import { FirestoreModel, type Timestampble } from 'cic-kit';
import { DEFAULT_PROJECT_MESSAGE_TYPES, normalizeMessageType } from './Project';

function normalizeString(value: unknown, maxLength = 2000) {
  const normalized = String(value ?? '').trim();
  if (!normalized) return '';
  return normalized.slice(0, maxLength);
}

function normalizePayload(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }

  return value as Record<string, unknown>;
}

function normalizeTypeMessage(value: unknown) {
  const normalized = normalizeMessageType(value);
  return normalized || DEFAULT_PROJECT_MESSAGE_TYPES[2];
}

export interface ProjectMessageData extends Partial<Timestampble> {
  id: string;
  projectId: string;
  taskId?: string;
  typeMessage: string;
  title?: string;
  message: string;
  sourceProjectId?: string;
  sourceLabel?: string;
  payload?: Record<string, unknown>;
  updateBy: string;
}

export class ProjectMessage extends FirestoreModel<ProjectMessageData> {
  static collectionName = 'projectMessages';

  projectId: string;
  taskId?: string;
  typeMessage: string;
  title?: string;
  message: string;
  sourceProjectId?: string;
  sourceLabel?: string;
  payload?: Record<string, unknown>;
  updateBy: string;

  constructor(data: ProjectMessageData) {
    super(data);
    this.projectId = normalizeString(data.projectId, 120);
    this.taskId = normalizeString(data.taskId, 120) || undefined;
    this.typeMessage = normalizeTypeMessage(data.typeMessage);
    this.title = normalizeString(data.title, 160) || undefined;
    this.message = normalizeString(data.message, 4000);
    this.sourceProjectId = normalizeString(data.sourceProjectId, 120) || undefined;
    this.sourceLabel = normalizeString(data.sourceLabel, 120) || undefined;
    this.payload = normalizePayload(data.payload);
    this.updateBy = normalizeString(data.updateBy, 120) || 'system';
  }

  toData(): ProjectMessageData {
    return {
      id: this.id,
      projectId: normalizeString(this.projectId, 120),
      taskId: normalizeString(this.taskId, 120) || undefined,
      typeMessage: normalizeTypeMessage(this.typeMessage),
      title: normalizeString(this.title, 160) || undefined,
      message: normalizeString(this.message, 4000),
      sourceProjectId: normalizeString(this.sourceProjectId, 120) || undefined,
      sourceLabel: normalizeString(this.sourceLabel, 120) || undefined,
      payload: normalizePayload(this.payload),
      updateBy: normalizeString(this.updateBy, 120) || 'system',
      ...this.timestampbleProps(),
    };
  }
}
