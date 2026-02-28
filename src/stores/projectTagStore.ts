import { reactive } from 'vue';
import { FirestoreStore, toColorTagArray, type ColorTag } from 'cic-kit';
import { where } from 'firebase/firestore';
import { ProjectTag, createProjectTagData, type ProjectTagData } from '../models/ProjectTag';

class ProjectTagStore extends FirestoreStore<ProjectTag, ProjectTagData> {
  constructor() {
    super(ProjectTag);
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

  forProjectAsColorTags(projectId: string) {
    return this.forProject(projectId).map((item) => item.tag);
  }

  async upsertForProject(projectId: string, tags: ColorTag[], updateBy: string) {
    const normalizedProject = String(projectId ?? '').trim();
    const normalizedTags = toColorTagArray(tags);

    if (!normalizedProject || !normalizedTags.length) return;

    const byLabel = new Map(
      this.forProject(normalizedProject).map((item) => [item.tag.label.trim().toLowerCase(), item]),
    );

    for (const tag of normalizedTags) {
      const key = tag.label.trim().toLowerCase();
      const existing = byLabel.get(key);

      if (existing) {
        if (existing.tag.color !== tag.color) {
          await existing.update({ tag, updateBy });
        }
        continue;
      }

      await this.add(createProjectTagData(normalizedProject, tag, updateBy));
    }
  }
}

export const projectTagStore = reactive(new ProjectTagStore());
