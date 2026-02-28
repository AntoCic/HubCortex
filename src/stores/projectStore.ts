import { reactive } from 'vue';
import { FirestoreStore } from 'cic-kit';
import { Project, type ProjectData } from '../models/Project';

class ProjectStore extends FirestoreStore<Project, ProjectData> {
  constructor() {
    super(Project);
  }
}

export const projectStore = reactive(new ProjectStore());
