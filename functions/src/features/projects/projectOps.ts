import { FieldValue } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { HttpsError, onCall, onRequest } from 'firebase-functions/v2/https';
import { db } from '../../config/firebaseAdmin.js';
import { REGION } from '../../config/runtime.js';
import { GITHUB_TOKEN } from '../../config/secret.js';
import { requireAuth, requireGitHubManagePermission, requireProjectWritePermission } from '../../utils/auth.js';
import { readOptionalBoolean, readOptionalString, readRequiredString } from '../../utils/validation.js';

const PROJECTS_COLLECTION = 'projects';
const TASKS_COLLECTION = 'projectTasks';
const PROJECT_MESSAGES_COLLECTION = 'projectMessages';
const PROJECT_NOTIFICATION_PREFERENCES_COLLECTION = 'projectNotificationPreferences';
const USERS_COLLECTION = 'users';
const DEFAULT_MESSAGE_TYPES = ['error', 'warning', 'info', 'deploy'] as const;
const TASK_STATUSES = ['todo', 'doing', 'blocked', 'bug', 'done'] as const;
const DEFAULT_TASK_STATUS = TASK_STATUSES[0];
const MAX_TASK_COUNTER = 999999;

type TaskStatus = (typeof TASK_STATUSES)[number];

type TaskTag = {
  label: string;
  color: string;
};

type BranchRequest = {
  projectId: string;
  taskId: string;
  branchName?: string;
  sourceBranch?: string;
};

type CreateProjectTaskRequest = {
  projectId: string;
  title: string;
  description?: string;
  status?: string;
  tag?: TaskTag[];
};

type CreateProjectTaskResponse = {
  id: string;
  taskNumber: number;
  taskCode: string;
  branchName: string;
  status: TaskStatus;
};

type BranchResponse = {
  branchName: string;
  created: boolean;
  message: string;
};

type ListGitHubRepositoriesRequest = {
  org?: string;
};

type GitHubRepositoryItem = {
  id: number;
  fullName: string;
  url: string;
  owner: string;
  name: string;
  isPrivate: boolean;
  isArchived: boolean;
  defaultBranch?: string;
  updatedAt?: string;
};

type ListGitHubRepositoriesResponse = {
  source: 'org' | 'user';
  org?: string;
  repositories: GitHubRepositoryItem[];
};

type PublishProjectMessageRequest = {
  apiKey: string;
  typeMessage?: string;
  title?: string;
  message: string;
  payload?: Record<string, unknown>;
  sendPush?: boolean;
};

type PublishProjectMessageResponse = {
  id: string;
  typeMessage: string;
  sentUsers: number;
  sentTokens: number;
};

type MessagePayloadInput = {
  typeMessage: string;
  title?: string;
  message: string;
  payload?: Record<string, unknown>;
};

type ParsedGitHubRepo = {
  owner: string;
  repo: string;
};

export const createProjectTaskBranch = onCall<BranchRequest>(
  {
    region: REGION,
    secrets: [GITHUB_TOKEN],
  },
  async (request): Promise<BranchResponse> => {
    const uid = requireAuth(request);
    await requireGitHubManagePermission(request);

    const data = asObject(request.data);
    const projectId = readRequiredString(data, 'projectId', { maxLength: 120 });
    const taskId = readRequiredString(data, 'taskId', { maxLength: 120 });
    const inputBranchName = readOptionalString(data, 'branchName', { maxLength: 160 });
    const sourceBranch = readOptionalString(data, 'sourceBranch', { maxLength: 120 });

    const { projectRef, projectData, taskRef, taskData } = await loadProjectAndTask(projectId, taskId);

    const repoUrl = String(projectData.repoUrl ?? '').trim();
    if (!repoUrl) {
      throw new HttpsError('failed-precondition', 'Repo URL non configurata nel progetto.');
    }

    const parsedRepo = parseGitHubRepo(repoUrl);
    if (!parsedRepo) {
      throw new HttpsError('failed-precondition', 'Repo URL GitHub non valida.');
    }

    const taskCode = readTaskCode(taskData);
    const generatedBranchName = taskCode
      ? buildBranchNameFromTask(String(taskData.title ?? 'task'), taskCode)
      : buildLegacyBranchNameFromTask(String(taskData.title ?? 'task'), taskId);
    const branchName = normalizeBranchName(inputBranchName ?? generatedBranchName);
    if (!branchName) {
      throw new HttpsError('invalid-argument', 'Nome branch non valido.');
    }

    const result = await createGitHubBranch(parsedRepo, branchName, sourceBranch);

    await taskRef.set(
      {
        branchName,
        updateBy: uid,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    await projectRef.set(
      {
        updateBy: uid,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return {
      branchName,
      created: result.created,
      message: result.created ? 'Branch creata.' : 'Branch gia esistente.',
    };
  },
);

export const deleteProjectTaskBranch = onCall<BranchRequest>(
  {
    region: REGION,
    secrets: [GITHUB_TOKEN],
  },
  async (request): Promise<BranchResponse> => {
    const uid = requireAuth(request);
    await requireGitHubManagePermission(request);

    const data = asObject(request.data);
    const projectId = readRequiredString(data, 'projectId', { maxLength: 120 });
    const taskId = readRequiredString(data, 'taskId', { maxLength: 120 });
    const inputBranchName = readOptionalString(data, 'branchName', { maxLength: 160 });

    const { taskRef, taskData, projectData } = await loadProjectAndTask(projectId, taskId);

    const repoUrl = String(projectData.repoUrl ?? '').trim();
    if (!repoUrl) {
      throw new HttpsError('failed-precondition', 'Repo URL non configurata nel progetto.');
    }

    const parsedRepo = parseGitHubRepo(repoUrl);
    if (!parsedRepo) {
      throw new HttpsError('failed-precondition', 'Repo URL GitHub non valida.');
    }

    const branchName = normalizeBranchName(inputBranchName ?? String(taskData.branchName ?? ''));
    if (!branchName) {
      throw new HttpsError('invalid-argument', 'Nome branch non disponibile.');
    }

    const deleted = await deleteGitHubBranch(parsedRepo, branchName);

    await taskRef.set(
      {
        branchName: FieldValue.delete(),
        updateBy: uid,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return {
      branchName,
      created: false,
      message: deleted ? 'Branch eliminata.' : 'Branch non trovata su GitHub.',
    };
  },
);

export const listGitHubRepositories = onCall<ListGitHubRepositoriesRequest>(
  {
    region: REGION,
    secrets: [GITHUB_TOKEN],
  },
  async (request): Promise<ListGitHubRepositoriesResponse> => {
    requireAuth(request);
    await requireGitHubManagePermission(request);

    const data = request.data ? asObject(request.data) : {};
    const org = readOptionalString(data, 'org', { maxLength: 120 });
    const normalizedOrg = normalizeGitHubOrg(org);

    const source: 'org' | 'user' = normalizedOrg ? 'org' : 'user';
    const path = normalizedOrg
      ? `/orgs/${encodeURIComponent(normalizedOrg)}/repos?per_page=100&sort=updated&type=all`
      : '/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member';

    const response = await githubRequest(path, getGitHubToken(), undefined, [200]);
    return {
      source,
      org: normalizedOrg || undefined,
      repositories: normalizeGitHubRepositoryList(response.data),
    };
  },
);

export const createProjectTask = onCall<CreateProjectTaskRequest>(
  {
    region: REGION,
  },
  async (request): Promise<CreateProjectTaskResponse> => {
    const uid = requireAuth(request);
    await requireProjectWritePermission(request);

    const data = asObject(request.data);
    const projectId = readRequiredString(data, 'projectId', { maxLength: 120 });
    const title = readRequiredString(data, 'title', { maxLength: 200 });
    const description = readOptionalString(data, 'description', { maxLength: 50000 });
    const status = normalizeTaskStatus(readOptionalString(data, 'status', { maxLength: 32 }) || DEFAULT_TASK_STATUS);
    const tag = readOptionalTaskTags(data.tag);

    const projectRef = db.collection(PROJECTS_COLLECTION).doc(projectId);
    const taskRef = db.collection(TASKS_COLLECTION).doc();

    const created = await db.runTransaction(async (tx) => {
      const projectSnap = await tx.get(projectRef);
      if (!projectSnap.exists) {
        throw new HttpsError('not-found', 'Progetto non trovato.');
      }

      const projectData = asObject(projectSnap.data());
      const nextTaskNumber = normalizeTaskCounter(projectData.taskCounter) + 1;
      if (nextTaskNumber > MAX_TASK_COUNTER) {
        throw new HttpsError('failed-precondition', 'Limite task raggiunto per il progetto.');
      }

      const taskCode = buildTaskCode(nextTaskNumber);
      const taskData: Record<string, unknown> = {
        id: taskRef.id,
        projectId,
        taskNumber: nextTaskNumber,
        taskCode,
        title,
        status,
        updateBy: uid,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        deleteAt: null,
      };

      if (description) {
        taskData.description = description;
      }

      if (tag?.length) {
        taskData.tag = tag;
      }

      tx.set(taskRef, taskData);
      tx.set(
        projectRef,
        {
          taskCounter: nextTaskNumber,
          updateBy: uid,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      return {
        taskNumber: nextTaskNumber,
        taskCode,
        branchName: buildBranchNameFromTask(title, taskCode),
      };
    });

    return {
      id: taskRef.id,
      taskNumber: created.taskNumber,
      taskCode: created.taskCode,
      branchName: created.branchName,
      status,
    };
  },
);

export const publishProjectMessage = onCall<PublishProjectMessageRequest>(
  {
    region: REGION,
  },
  async (request): Promise<PublishProjectMessageResponse> => {
    const uid = requireAuth(request);
    await requireProjectWritePermission(request);

    const data = asObject(request.data);
    const apiKey = readRequiredString(data, 'apiKey', { maxLength: 160 });
    const sendPush = readOptionalBoolean(data.sendPush, true);
    const messageInput = readMessagePayloadInput(data);

    const project = await loadProjectByApiKey(apiKey);
    const messageResult = await createProjectMessage({
      projectId: project.id,
      projectRef: project.ref,
      projectData: project.data,
      input: messageInput,
      updateBy: uid,
      sendPush,
    });

    return {
      id: messageResult.id,
      typeMessage: messageResult.typeMessage,
      sentUsers: messageResult.sentUsers,
      sentTokens: messageResult.sentTokens,
    };
  },
);

export const ingestProjectMessage = onRequest(
  {
    region: REGION,
    cors: true,
  },
  async (req, res) => {
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ ok: false, error: 'Method Not Allowed' });
      return;
    }

    try {
      const payload = asObject(req.body);
      const apiKeyFromHeader = String(req.get('x-project-api-key') ?? '').trim();
      const apiKeyFromBody = String(payload.apiKey ?? '').trim();
      const apiKey = apiKeyFromHeader || apiKeyFromBody;

      if (!apiKey) {
        res.status(401).json({ ok: false, error: 'API key mancante.' });
        return;
      }

      const sendPush = readOptionalBoolean(payload.sendPush, true);
      const updateBy = readOptionalString(payload, 'updateBy', { maxLength: 120 }) || 'external-api';
      const project = await loadProjectByApiKey(apiKey);
      const input = readMessagePayloadInput(payload);

      const messageResult = await createProjectMessage({
        projectId: project.id,
        projectRef: project.ref,
        projectData: project.data,
        input,
        updateBy,
        sendPush,
      });

      res.status(200).json({
        ok: true,
        id: messageResult.id,
        projectId: project.id,
        typeMessage: messageResult.typeMessage,
        sentUsers: messageResult.sentUsers,
        sentTokens: messageResult.sentTokens,
      });
    } catch (error) {
      const status = readHttpStatus(error);
      const message = error instanceof Error ? error.message : 'Errore interno.';
      res.status(status).json({ ok: false, error: message });
    }
  },
);

async function loadProjectByApiKey(apiKey: string) {
  const snap = await db
    .collection(PROJECTS_COLLECTION)
    .where('apiKey', '==', apiKey)
    .limit(1)
    .get();

  const doc = snap.docs[0];
  if (!doc) {
    throw new HttpsError('unauthenticated', 'API key non valida.');
  }

  return {
    id: doc.id,
    ref: doc.ref,
    data: asObject(doc.data()),
  };
}

async function loadProjectAndTask(projectId: string, taskId: string) {
  const projectRef = db.collection(PROJECTS_COLLECTION).doc(projectId);
  const taskRef = db.collection(TASKS_COLLECTION).doc(taskId);
  const [projectSnap, taskSnap] = await Promise.all([projectRef.get(), taskRef.get()]);

  if (!projectSnap.exists) {
    throw new HttpsError('not-found', 'Progetto non trovato.');
  }

  if (!taskSnap.exists) {
    throw new HttpsError('not-found', 'Task non trovato.');
  }

  const projectData = asObject(projectSnap.data());
  const taskData = asObject(taskSnap.data());

  if (String(taskData.projectId ?? '').trim() !== projectId) {
    throw new HttpsError('invalid-argument', 'Il task non appartiene al progetto indicato.');
  }

  return {
    projectRef,
    taskRef,
    projectData,
    taskData,
  };
}

function readMessagePayloadInput(input: Record<string, unknown>): MessagePayloadInput {
  const message = readRequiredString(input, 'message', { maxLength: 4000 });
  const typeMessage = normalizeMessageType(readOptionalString(input, 'typeMessage', { maxLength: 48 }) || 'info');
  const title = readOptionalString(input, 'title', { maxLength: 160 });
  const payload = asOptionalObject(input.payload);

  return {
    typeMessage,
    title: title || undefined,
    message,
    payload,
  };
}

async function createProjectMessage(params: {
  projectId: string;
  projectRef: FirebaseFirestore.DocumentReference;
  projectData: Record<string, unknown>;
  input: MessagePayloadInput;
  updateBy: string;
  sendPush: boolean;
}) {
  const { projectId, projectRef, projectData, input, updateBy, sendPush } = params;
  const typeMessage = normalizeMessageType(input.typeMessage);
  const messageTypes = normalizeProjectMessageTypes(projectData.typeMessage);

  if (!messageTypes.includes(typeMessage)) {
    messageTypes.push(typeMessage);
    await projectRef.set(
      {
        typeMessage: messageTypes,
        updateBy,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  }

  const messageRef = db.collection(PROJECT_MESSAGES_COLLECTION).doc();
  const messageData: Record<string, unknown> = {
    id: messageRef.id,
    projectId,
    typeMessage,
    message: input.message,
    updateBy,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    deleteAt: null,
  };

  if (input.title) {
    messageData.title = input.title;
  }

  if (input.payload) {
    messageData.payload = input.payload;
  }

  await messageRef.set(messageData);

  if (!sendPush) {
    return {
      id: messageRef.id,
      typeMessage,
      sentUsers: 0,
      sentTokens: 0,
    };
  }

  const pushStats = await dispatchProjectPush({
    projectId,
    messageId: messageRef.id,
    typeMessage,
    title: input.title || `[${String(projectData.name ?? 'Project')}] ${typeMessage.toUpperCase()}`,
    body: input.message,
  });

  return {
    id: messageRef.id,
    typeMessage,
    sentUsers: pushStats.sentUsers,
    sentTokens: pushStats.sentTokens,
  };
}

async function dispatchProjectPush(input: {
  projectId: string;
  messageId: string;
  typeMessage: string;
  title: string;
  body: string;
}) {
  const preferenceSnap = await db
    .collection(PROJECT_NOTIFICATION_PREFERENCES_COLLECTION)
    .where('projectId', '==', input.projectId)
    .get();

  const disabledByUser = new Map<string, Set<string>>();

  for (const doc of preferenceSnap.docs) {
    const data = asObject(doc.data());
    const userId = String(data.userId ?? '').trim();
    if (!userId) continue;
    disabledByUser.set(userId, new Set(normalizeTypeArray(data.disabledTypeMessage)));
  }

  const userSnap = await db.collection(USERS_COLLECTION).get();
  const allTokens = new Set<string>();
  let sentUsers = 0;

  for (const doc of userSnap.docs) {
    const userId = doc.id;
    const data = asObject(doc.data());
    const tokens = toStringArray(data.fcmTokens);
    if (!tokens.length) continue;

    const disabled = disabledByUser.get(userId);
    const isEnabled = !disabled?.has(input.typeMessage);
    if (!isEnabled) continue;

    sentUsers += 1;
    for (const token of tokens) {
      allTokens.add(token);
    }
  }

  const tokenList = [...allTokens];
  if (!tokenList.length) {
    return { sentUsers: 0, sentTokens: 0 };
  }

  let sentTokens = 0;

  for (let index = 0; index < tokenList.length; index += 500) {
    const chunk = tokenList.slice(index, index + 500);
    const result = await getMessaging().sendEachForMulticast({
      tokens: chunk,
      notification: {
        title: input.title,
        body: input.body.slice(0, 300),
      },
      data: {
        url: `/projects?projectId=${input.projectId}&messageId=${input.messageId}`,
        projectId: input.projectId,
        messageId: input.messageId,
        typeMessage: input.typeMessage,
      },
    });

    sentTokens += result.successCount;
  }

  return {
    sentUsers,
    sentTokens,
  };
}

function normalizeGitHubOrg(value: unknown) {
  const normalized = String(value ?? '').trim().replace(/^@+/, '');
  if (!normalized || normalized.toLowerCase() === 'your-org') {
    return '';
  }
  return normalized.slice(0, 120);
}

function normalizeGitHubRepositoryList(value: unknown): GitHubRepositoryItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const repositories: GitHubRepositoryItem[] = [];

  for (const item of value) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const record = item as Record<string, unknown>;
    const id = Number(record.id ?? 0);
    const fullName = String(record.full_name ?? '').trim();
    const url = String(record.html_url ?? '').trim();
    if (!id || !fullName || !url) continue;

    const ownerData =
      record.owner && typeof record.owner === 'object' && !Array.isArray(record.owner)
        ? (record.owner as Record<string, unknown>)
        : {};

    repositories.push({
      id,
      fullName,
      url,
      owner: String(ownerData.login ?? '').trim(),
      name: String(record.name ?? '').trim(),
      isPrivate: Boolean(record.private),
      isArchived: Boolean(record.archived),
      defaultBranch: String(record.default_branch ?? '').trim() || undefined,
      updatedAt: String(record.updated_at ?? '').trim() || undefined,
    });
  }

  return repositories.sort((a, b) => a.fullName.localeCompare(b.fullName));
}

async function createGitHubBranch(repo: ParsedGitHubRepo, branchName: string, sourceBranch?: string) {
  const token = getGitHubToken();
  const baseBranch = sourceBranch ? normalizeBranchName(sourceBranch) : await getDefaultGitHubBranch(repo, token);
  const baseBranchSha = await getGitHubBranchSha(repo, baseBranch, token);

  const response = await githubRequest(
    `/repos/${repo.owner}/${repo.repo}/git/refs`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({
        ref: `refs/heads/${branchName}`,
        sha: baseBranchSha,
      }),
    },
    [201, 422],
  );

  if (response.status === 422) {
    return { created: false };
  }

  return { created: true };
}

async function deleteGitHubBranch(repo: ParsedGitHubRepo, branchName: string) {
  const token = getGitHubToken();
  const response = await githubRequest(
    `/repos/${repo.owner}/${repo.repo}/git/refs/heads/${encodeURIComponent(branchName)}`,
    token,
    { method: 'DELETE' },
    [204, 404],
  );

  return response.status === 204;
}

async function getDefaultGitHubBranch(repo: ParsedGitHubRepo, token: string) {
  const response = await githubRequest(`/repos/${repo.owner}/${repo.repo}`, token, undefined, [200]);
  const data = asObject(response.data);
  const branch = String(data.default_branch ?? '').trim();
  if (!branch) {
    throw new HttpsError('internal', 'Default branch GitHub non trovata.');
  }
  return branch;
}

async function getGitHubBranchSha(repo: ParsedGitHubRepo, branchName: string, token: string) {
  const response = await githubRequest(
    `/repos/${repo.owner}/${repo.repo}/git/ref/heads/${encodeURIComponent(branchName)}`,
    token,
    undefined,
    [200],
  );

  const data = asObject(response.data);
  const object = asObject(data.object);
  const sha = String(object.sha ?? '').trim();
  if (!sha) {
    throw new HttpsError('internal', 'SHA branch GitHub non disponibile.');
  }
  return sha;
}

async function githubRequest(
  path: string,
  token: string,
  init?: RequestInit,
  acceptedStatuses: number[] = [200],
) {
  const response = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'User-Agent': 'HubCortex',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init?.headers ?? {}),
    },
  });

  const rawText = await response.text();
  const data = parseJson(rawText);

  if (!acceptedStatuses.includes(response.status)) {
    const message = extractGitHubErrorMessage(data) || `GitHub API error: ${response.status}`;
    throw new HttpsError('internal', message);
  }

  return {
    status: response.status,
    data,
  };
}

function extractGitHubErrorMessage(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return '';
  const record = value as Record<string, unknown>;
  const message = String(record.message ?? '').trim();
  if (message) return message;
  return '';
}

function parseJson(raw: string): unknown {
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function getGitHubToken() {
  const token = GITHUB_TOKEN.value();
  if (!token) {
    throw new HttpsError('failed-precondition', 'Secret GITHUB_TOKEN non configurato.');
  }
  return token;
}

function parseGitHubRepo(value: string): ParsedGitHubRepo | null {
  const normalized = String(value ?? '').trim();
  if (!normalized) return null;

  const ssh = normalized.match(/^git@github\.com:([^/]+)\/([^/]+?)(?:\.git)?$/i);
  if (ssh?.[1] && ssh?.[2]) {
    return {
      owner: ssh[1],
      repo: ssh[2],
    };
  }

  const https = normalized.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?\/?$/i);
  if (https?.[1] && https?.[2]) {
    return {
      owner: https[1],
      repo: https[2],
    };
  }

  const short = normalized.match(/^([^/\s]+)\/([^/\s]+)$/);
  if (short?.[1] && short?.[2]) {
    return {
      owner: short[1],
      repo: short[2].replace(/\.git$/i, ''),
    };
  }

  return null;
}

function buildBranchNameFromTask(title: string, taskCode: string) {
  const code = normalizeTaskCode(taskCode) || 'T0';
  const slug = String(title ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

  return normalizeBranchName(`${code}-${slug || 'task'}`);
}

function buildLegacyBranchNameFromTask(title: string, taskId: string) {
  const slug = String(title ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);

  return normalizeBranchName(`task/${slug || 'task'}-${taskId.slice(0, 6)}`);
}

function normalizeBranchName(value: string) {
  return String(value ?? '')
    .trim()
    .replace(/[^A-Za-z0-9/_-]+/g, '-')
    .replace(/\/{2,}/g, '/')
    .replace(/^-+|-+$/g, '')
    .replace(/^\/+|\/+$/g, '')
    .slice(0, 120);
}

function normalizeTaskCounter(value: unknown) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) return 0;
  return parsed;
}

function buildTaskCode(taskNumber: number) {
  return `T${taskNumber}`;
}

function normalizeTaskCode(value: unknown) {
  const raw = String(value ?? '').trim();
  const match = raw.match(/^t?(\d{1,6})$/i);
  if (!match?.[1]) return '';
  return buildTaskCode(Number(match[1]));
}

function readTaskCode(taskData: Record<string, unknown>) {
  const explicit = normalizeTaskCode(taskData.taskCode);
  if (explicit) return explicit;

  const taskNumber = normalizeTaskCounter(taskData.taskNumber);
  if (taskNumber > 0) {
    return buildTaskCode(taskNumber);
  }

  return '';
}

function normalizeTaskStatus(value: unknown): TaskStatus {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (TASK_STATUSES.includes(normalized as TaskStatus)) {
    return normalized as TaskStatus;
  }
  return DEFAULT_TASK_STATUS;
}

function readOptionalTaskTags(value: unknown): TaskTag[] | undefined {
  if (value == null) return undefined;
  if (!Array.isArray(value)) {
    throw new HttpsError('invalid-argument', 'Campo "tag" deve essere un array.');
  }

  const output: TaskTag[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const record = item as Record<string, unknown>;
    const label = String(record.label ?? '').trim().slice(0, 40);
    const color = String(record.color ?? '').trim().slice(0, 24);
    if (!label || !color) continue;
    output.push({ label, color });
  }

  if (!output.length) return undefined;
  return output.slice(0, 30);
}

function normalizeProjectMessageTypes(value: unknown) {
  const set = new Set<string>(DEFAULT_MESSAGE_TYPES);

  if (Array.isArray(value)) {
    for (const item of value) {
      const normalized = normalizeMessageType(item);
      if (normalized) {
        set.add(normalized);
      }
    }
  }

  return [...set];
}

function normalizeTypeArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  const set = new Set<string>();
  for (const item of value) {
    const normalized = normalizeMessageType(item);
    if (normalized) {
      set.add(normalized);
    }
  }
  return [...set];
}

function normalizeMessageType(value: unknown) {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_-]/g, '');

  return normalized || 'info';
}

function toStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  const set = new Set<string>();
  for (const item of value) {
    const normalized = String(item ?? '').trim();
    if (normalized) {
      set.add(normalized);
    }
  }
  return [...set];
}

function asOptionalObject(value: unknown) {
  if (value == null) return undefined;
  return stripUndefinedDeep(asObject(value));
}

function asObject(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new HttpsError('invalid-argument', 'Payload non valido.');
  }
  return value as Record<string, unknown>;
}

function stripUndefinedDeep(value: unknown): Record<string, unknown> {
  const output: Record<string, unknown> = {};

  for (const [key, item] of Object.entries(asObject(value))) {
    const sanitized = sanitizeValue(item);
    if (sanitized !== undefined) {
      output[key] = sanitized;
    }
  }

  return output;
}

function sanitizeValue(value: unknown): unknown {
  if (value === undefined) return undefined;

  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeValue(item))
      .filter((item) => item !== undefined);
  }

  if (value && typeof value === 'object') {
    return stripUndefinedDeep(value);
  }

  return value;
}

function readHttpStatus(error: unknown) {
  if (!(error instanceof HttpsError)) return 500;

  switch (error.code) {
    case 'invalid-argument':
      return 400;
    case 'unauthenticated':
      return 401;
    case 'permission-denied':
      return 403;
    case 'not-found':
      return 404;
    case 'already-exists':
      return 409;
    case 'failed-precondition':
      return 412;
    default:
      return 500;
  }
}
