import { FirestoreModel, type Timestampble } from 'cic-kit';
import { normalizeMessageType } from './Project';

function normalizeString(value: unknown, maxLength = 120) {
  const normalized = String(value ?? '').trim();
  if (!normalized) return '';
  return normalized.slice(0, maxLength);
}

function normalizeDisabledTypes(value: unknown) {
  if (!Array.isArray(value)) return [];

  const set = new Set<string>();
  for (const item of value) {
    const normalized = normalizeMessageType(item);
    if (normalized) {
      set.add(normalized);
    }
  }

  return [...set];
}

export function buildProjectNotificationPreferenceId(projectId: string, userId: string) {
  const project = normalizeString(projectId);
  const user = normalizeString(userId);
  return `${project}__${user}`;
}

export interface ProjectNotificationPreferenceData extends Partial<Timestampble> {
  id: string;
  projectId: string;
  userId: string;
  disabledTypeMessage?: string[];
  updateBy: string;
}

export class ProjectNotificationPreference extends FirestoreModel<ProjectNotificationPreferenceData> {
  static collectionName = 'projectNotificationPreferences';

  projectId: string;
  userId: string;
  disabledTypeMessage: string[];
  updateBy: string;

  constructor(data: ProjectNotificationPreferenceData) {
    super(data);
    this.projectId = normalizeString(data.projectId);
    this.userId = normalizeString(data.userId);
    this.disabledTypeMessage = normalizeDisabledTypes(data.disabledTypeMessage);
    this.updateBy = normalizeString(data.updateBy) || 'system';
  }

  isTypeEnabled(typeMessage: string) {
    const normalized = normalizeMessageType(typeMessage);
    if (!normalized) return true;
    return !this.disabledTypeMessage.includes(normalized);
  }

  toData(): ProjectNotificationPreferenceData {
    return {
      id: buildProjectNotificationPreferenceId(this.projectId, this.userId),
      projectId: normalizeString(this.projectId),
      userId: normalizeString(this.userId),
      disabledTypeMessage: normalizeDisabledTypes(this.disabledTypeMessage),
      updateBy: normalizeString(this.updateBy) || 'system',
      ...this.timestampbleProps(),
    };
  }
}
