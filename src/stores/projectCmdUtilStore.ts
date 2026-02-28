import { reactive } from 'vue';
import { FirestoreStore } from 'cic-kit';
import { where } from 'firebase/firestore';
import { ProjectCmdUtil, type ProjectCmdUtilData } from '../models/ProjectCmdUtil';

class ProjectCmdUtilStore extends FirestoreStore<ProjectCmdUtil, ProjectCmdUtilData> {
  constructor() {
    super(ProjectCmdUtil);
  }

  async getForProject(projectId: string) {
    const normalized = String(projectId ?? '').trim();
    if (!normalized) return {};
    return this.get({ query: where('projectId', '==', normalized) });
  }

  async startForProject(projectId: string) {
    const normalized = String(projectId ?? '').trim();
    if (!normalized) {
      this.stop();
      return;
    }

    await this.start({ query: where('projectId', '==', normalized) });
  }

  forProject(projectId: string) {
    const normalized = String(projectId ?? '').trim();
    return this.itemsActiveArray.filter((item) => item.projectId === normalized);
  }
}

export const projectCmdUtilStore = reactive(new ProjectCmdUtilStore());
