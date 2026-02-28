import { FirestoreModel, toColorTagArray, type ColorTag, type Timestampble } from 'cic-kit';
import { TaskStatus, isTaskStatus, type TaskStatusType } from '@shared/enums/TaskStatus';

function normalizeTags(value: unknown) {
  const normalized = toColorTagArray(value);
  if (!normalized.length) return undefined;
  return normalized.slice(0, 30);
}

export interface ProjectTaskData extends Partial<Timestampble> {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  tag?: ColorTag[];
  status: TaskStatusType;
  branchName?: string;
  updateBy: string;
}

export class ProjectTask extends FirestoreModel<ProjectTaskData> {
  static collectionName = 'projectTasks';

  projectId: string;
  title: string;
  description?: string;
  tag?: ColorTag[];
  status: TaskStatusType;
  branchName?: string;
  updateBy: string;

  constructor(data: ProjectTaskData) {
    super(data);
    this.projectId = data.projectId;
    this.title = data.title;
    this.description = data.description;
    this.tag = normalizeTags(data.tag);
    this.status = isTaskStatus(data.status) ? data.status : TaskStatus.TODO;
    this.branchName = data.branchName;
    this.updateBy = data.updateBy;
  }

  toData(): ProjectTaskData {
    return {
      id: this.id,
      projectId: this.projectId,
      title: this.title,
      description: this.description,
      tag: normalizeTags(this.tag),
      status: this.status,
      branchName: this.branchName,
      updateBy: this.updateBy,
      ...this.timestampbleProps(),
    };
  }
}
