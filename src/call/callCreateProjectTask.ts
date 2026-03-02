import { ensureFirebase, functions, type ColorTag } from 'cic-kit';
import { httpsCallable } from 'firebase/functions';
import type { TaskStatusType } from '@shared/enums/TaskStatus';

export type CreateProjectTaskRequest = {
  projectId: string;
  title: string;
  description?: string;
  status?: TaskStatusType;
  tag?: ColorTag[];
};

export type CreateProjectTaskResponse = {
  id: string;
  taskNumber: number;
  taskCode: string;
  branchName: string;
  status: TaskStatusType;
};

function getCreateProjectTaskCallable() {
  ensureFirebase();
  return httpsCallable<CreateProjectTaskRequest, CreateProjectTaskResponse>(functions, 'createProjectTask');
}

export async function callCreateProjectTask(input: CreateProjectTaskRequest): Promise<CreateProjectTaskResponse> {
  const callable = getCreateProjectTaskCallable();
  const result = await callable(input);
  return result.data;
}
