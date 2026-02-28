import { reactive } from 'vue';
import { FirestoreStore } from 'cic-kit';
import { where } from 'firebase/firestore';
import { ProjectNote, type ProjectNoteData } from '../models/ProjectNote';

class ProjectNoteStore extends FirestoreStore<ProjectNote, ProjectNoteData> {
  constructor() {
    super(ProjectNote);
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

export const projectNoteStore = reactive(new ProjectNoteStore());
