import { FirestoreModel, type Timestampble } from 'cic-kit';

export const PROJECT_STATUS_LEVELS = ['info', 'warning', 'error'] as const;
export type ProjectStatusLevel = (typeof PROJECT_STATUS_LEVELS)[number];

export interface ProjectStatusData extends Partial<Timestampble> {
  id: string;
  projectId: string;
  taskId?: string;
  level: ProjectStatusLevel;
  message: string;
  updateBy: string;
}

export class ProjectStatus extends FirestoreModel<ProjectStatusData> {
  static collectionName = 'projectStatuses';

  projectId: string;
  taskId?: string;
  level: ProjectStatusLevel;
  message: string;
  updateBy: string;

  constructor(data: ProjectStatusData) {
    super(data);
    this.projectId = data.projectId;
    this.taskId = data.taskId;
    this.level = PROJECT_STATUS_LEVELS.includes(data.level) ? data.level : 'info';
    this.message = data.message;
    this.updateBy = data.updateBy;
  }

  toData(): ProjectStatusData {
    return {
      id: this.id,
      projectId: this.projectId,
      taskId: this.taskId,
      level: this.level,
      message: this.message,
      updateBy: this.updateBy,
      ...this.timestampbleProps(),
    };
  }
}
