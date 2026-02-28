import { reactive } from 'vue';
import { FirestoreStore } from 'cic-kit';
import { where } from 'firebase/firestore';
import { ProjectMessage, type ProjectMessageData } from '../models/ProjectMessage';

function readMillis(value: unknown) {
  if (!value) return 0;
  if (typeof value === 'number') return value;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'object' && value && 'toMillis' in value && typeof value.toMillis === 'function') {
    return Number(value.toMillis());
  }
  const parsed = new Date(String(value)).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

class ProjectMessageStore extends FirestoreStore<ProjectMessage, ProjectMessageData> {
  constructor() {
    super(ProjectMessage);
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
    return this.itemsActiveArray
      .filter((item) => item.projectId === normalized)
      .sort((a, b) => readMillis(b.createdAt) - readMillis(a.createdAt));
  }
}

export const projectMessageStore = reactive(new ProjectMessageStore());
