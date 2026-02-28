import { reactive } from 'vue';
import { FirestoreStore } from 'cic-kit';
import { ProjectStatus, type ProjectStatusData } from '../models/ProjectStatus';

class ProjectStatusStore extends FirestoreStore<ProjectStatus, ProjectStatusData> {
  constructor() {
    super(ProjectStatus);
  }

  forProject(projectId: string) {
    const normalized = String(projectId ?? '').trim();
    return this.itemsActiveArray.filter((item) => item.projectId === normalized);
  }
}

export const projectStatusStore = reactive(new ProjectStatusStore());
