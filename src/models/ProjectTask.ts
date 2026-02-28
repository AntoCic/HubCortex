import { FirestoreModel, type Timestampble } from 'cic-kit';

export const TASK_STATUSES = ['todo', 'doing', 'blocked', 'done'] as const;
export type TaskStatusType = (typeof TASK_STATUSES)[number];

export interface ProjectTaskData extends Partial<Timestampble> {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: TaskStatusType;
  branchName?: string;
  errorMessage?: string;
  updateBy: string;
}

export class ProjectTask extends FirestoreModel<ProjectTaskData> {
  static collectionName = 'projectTasks';

  projectId: string;
  title: string;
  description?: string;
  status: TaskStatusType;
  branchName?: string;
  errorMessage?: string;
  updateBy: string;

  constructor(data: ProjectTaskData) {
    super(data);
    this.projectId = data.projectId;
    this.title = data.title;
    this.description = data.description;
    this.status = TASK_STATUSES.includes(data.status) ? data.status : 'todo';
    this.branchName = data.branchName;
    this.errorMessage = data.errorMessage;
    this.updateBy = data.updateBy;
  }

  toData(): ProjectTaskData {
    return {
      id: this.id,
      projectId: this.projectId,
      title: this.title,
      description: this.description,
      status: this.status,
      branchName: this.branchName,
      errorMessage: this.errorMessage,
      updateBy: this.updateBy,
      ...this.timestampbleProps(),
    };
  }
}
