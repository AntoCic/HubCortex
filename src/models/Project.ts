import { FirestoreModel, type Timestampble } from 'cic-kit';

export const PROJECT_STATUSES = ['planned', 'active', 'blocked', 'done'] as const;
export type ProjectStatusType = (typeof PROJECT_STATUSES)[number];

export interface ProjectData extends Partial<Timestampble> {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatusType;
  repoUrl?: string;
  createdBy: string;
  updateBy: string;
}

export class Project extends FirestoreModel<ProjectData> {
  static collectionName = 'projects';

  name: string;
  description?: string;
  status: ProjectStatusType;
  repoUrl?: string;
  createdBy: string;
  updateBy: string;

  constructor(data: ProjectData) {
    super(data);
    this.name = data.name;
    this.description = data.description;
    this.status = PROJECT_STATUSES.includes(data.status) ? data.status : 'planned';
    this.repoUrl = data.repoUrl;
    this.createdBy = data.createdBy;
    this.updateBy = data.updateBy;
  }

  toData(): ProjectData {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      status: this.status,
      repoUrl: this.repoUrl,
      createdBy: this.createdBy,
      updateBy: this.updateBy,
      ...this.timestampbleProps(),
    };
  }
}
