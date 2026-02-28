import { reactive } from 'vue';
import { FirestoreStore } from 'cic-kit';
import { ProjectTask, type ProjectTaskData } from '../models/ProjectTask';

class ProjectTaskStore extends FirestoreStore<ProjectTask, ProjectTaskData> {
  constructor() {
    super(ProjectTask);
  }

  forProject(projectId: string) {
    const normalized = String(projectId ?? '').trim();
    return this.itemsActiveArray.filter((item) => item.projectId === normalized);
  }
}

export const projectTaskStore = reactive(new ProjectTaskStore());
