import { reactive } from 'vue';
import { FirestoreStore } from 'cic-kit';
import { where } from 'firebase/firestore';
import {
  ProjectNotificationPreference,
  buildProjectNotificationPreferenceId,
  type ProjectNotificationPreferenceData,
} from '../models/ProjectNotificationPreference';
import { normalizeMessageType } from '../models/Project';

class ProjectNotificationPreferenceStore extends FirestoreStore<
  ProjectNotificationPreference,
  ProjectNotificationPreferenceData
> {
  constructor() {
    super(ProjectNotificationPreference);
  }

  async getForProject(projectId: string, userId?: string) {
    const normalized = String(projectId ?? '').trim();
    const normalizedUser = String(userId ?? '').trim();
    if (!normalized) return {};

    if (normalizedUser) {
      return this.get({
        query: [where('projectId', '==', normalized), where('userId', '==', normalizedUser)],
      });
    }

    return this.get({ query: where('projectId', '==', normalized) });
  }

  async startForProject(projectId: string, userId?: string) {
    const normalized = String(projectId ?? '').trim();
    const normalizedUser = String(userId ?? '').trim();
    if (!normalized) {
      this.stop();
      return;
    }
    if (normalizedUser) {
      await this.start({
        query: [where('projectId', '==', normalized), where('userId', '==', normalizedUser)],
      });
      return;
    }

    await this.start({ query: where('projectId', '==', normalized) });
  }

  forProject(projectId: string) {
    const normalized = String(projectId ?? '').trim();
    return this.itemsActiveArray.filter((item) => item.projectId === normalized);
  }

  findForProjectUser(projectId: string, userId: string) {
    const id = buildProjectNotificationPreferenceId(projectId, userId);
    return this.items?.[id];
  }

  async ensureForProjectUser(projectId: string, userId: string, updateBy: string) {
    const normalizedProject = String(projectId ?? '').trim();
    const normalizedUser = String(userId ?? '').trim();
    if (!normalizedProject || !normalizedUser) return undefined;

    const id = buildProjectNotificationPreferenceId(normalizedProject, normalizedUser);
    const existing = this.items?.[id] ?? (await this.getOne(id));
    if (existing) return existing;

    return this.add({
      id,
      projectId: normalizedProject,
      userId: normalizedUser,
      disabledTypeMessage: [],
      updateBy,
    });
  }

  isTypeEnabled(projectId: string, userId: string, typeMessage: string) {
    const preference = this.findForProjectUser(projectId, userId);
    if (!preference) return true;
    return preference.isTypeEnabled(typeMessage);
  }

  async setTypeEnabled(projectId: string, userId: string, typeMessage: string, enabled: boolean, updateBy: string) {
    const normalizedType = normalizeMessageType(typeMessage);
    if (!normalizedType) return;

    const preference = await this.ensureForProjectUser(projectId, userId, updateBy);
    if (!preference) return;

    const set = new Set(preference.disabledTypeMessage);
    if (enabled) {
      set.delete(normalizedType);
    } else {
      set.add(normalizedType);
    }

    await preference.update({
      disabledTypeMessage: [...set],
      updateBy,
    });
  }
}

export const projectNotificationPreferenceStore = reactive(new ProjectNotificationPreferenceStore());
