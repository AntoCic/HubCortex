import { ensureFirebase, functions } from 'cic-kit';
import { httpsCallable } from 'firebase/functions';

export type ProjectBranchRequest = {
  projectId: string;
  taskId: string;
  branchName?: string;
  sourceBranch?: string;
};

export type ProjectBranchResponse = {
  branchName: string;
  created: boolean;
  message: string;
};

function createBranchCallable() {
  ensureFirebase();
  return httpsCallable<ProjectBranchRequest, ProjectBranchResponse>(functions, 'createProjectTaskBranch');
}

function deleteBranchCallable() {
  ensureFirebase();
  return httpsCallable<ProjectBranchRequest, ProjectBranchResponse>(functions, 'deleteProjectTaskBranch');
}

export async function callCreateProjectTaskBranch(input: ProjectBranchRequest): Promise<ProjectBranchResponse> {
  const callable = createBranchCallable();
  const result = await callable(input);
  return result.data;
}

export async function callDeleteProjectTaskBranch(input: ProjectBranchRequest): Promise<ProjectBranchResponse> {
  const callable = deleteBranchCallable();
  const result = await callable(input);
  return result.data;
}
