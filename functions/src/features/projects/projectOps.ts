import { FieldValue } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { HttpsError, onCall, onRequest } from 'firebase-functions/v2/https';
import { db } from '../../config/firebaseAdmin.js';
import { REGION } from '../../config/runtime.js';
import { GITHUB_TOKEN } from '../../config/secret.js';
import { requireAuth } from '../../utils/auth.js';
import { readOptionalBoolean, readOptionalString, readRequiredString } from '../../utils/validation.js';

const PROJECTS_COLLECTION = 'projects';
const TASKS_COLLECTION = 'projectTasks';
const PROJECT_MESSAGES_COLLECTION = 'projectMessages';
const PROJECT_NOTIFICATION_PREFERENCES_COLLECTION = 'projectNotificationPreferences';
const USERS_COLLECTION = 'users';
const DEFAULT_MESSAGE_TYPES = ['error', 'warning', 'info'] as const;

type BranchRequest = {
  projectId: string;
  taskId: string;
  branchName?: string;
  sourceBranch?: string;
};

type BranchResponse = {
  branchName: string;
  created: boolean;
  message: string;
};

type PublishProjectMessageRequest = {
  projectId: string;
  taskId?: string;
  typeMessage?: string;
  title?: string;
  message: string;
  sourceProjectId?: string;
  sourceLabel?: string;
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
  taskId?: string;
  typeMessage: string;
  title?: string;
  message: string;
  sourceProjectId?: string;
  sourceLabel?: string;
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

    const generatedBranchName = buildBranchNameFromTask(String(taskData.title ?? 'task'), taskId);
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

export const publishProjectMessage = onCall<PublishProjectMessageRequest>(
  {
    region: REGION,
  },
  async (request): Promise<PublishProjectMessageResponse> => {
    const uid = requireAuth(request);

    const data = asObject(request.data);
    const projectId = readRequiredString(data, 'projectId', { maxLength: 120 });
    const sendPush = readOptionalBoolean(data.sendPush, true);
    const messageInput = readMessagePayloadInput(data);

    const project = await loadProjectById(projectId);
    const messageResult = await createProjectMessage({
      projectId,
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

async function loadProjectById(projectId: string) {
  const ref = db.collection(PROJECTS_COLLECTION).doc(projectId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new HttpsError('not-found', 'Progetto non trovato.');
  }
  return {
    id: snap.id,
    ref,
    data: asObject(snap.data()),
  };
}

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
  const taskId = readOptionalString(input, 'taskId', { maxLength: 120 });
  const typeMessage = normalizeMessageType(readOptionalString(input, 'typeMessage', { maxLength: 48 }) || 'info');
  const title = readOptionalString(input, 'title', { maxLength: 160 });
  const sourceProjectId = readOptionalString(input, 'sourceProjectId', { maxLength: 120 });
  const sourceLabel =
    readOptionalString(input, 'sourceLabel', { maxLength: 120 }) ||
    readOptionalString(input, 'source', { maxLength: 120 });
  const payload = asOptionalObject(input.payload);

  return {
    taskId: taskId || undefined,
    typeMessage,
    title: title || undefined,
    message,
    sourceProjectId: sourceProjectId || undefined,
    sourceLabel: sourceLabel || undefined,
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
  await messageRef.set({
    id: messageRef.id,
    projectId,
    taskId: input.taskId,
    typeMessage,
    title: input.title,
    message: input.message,
    sourceProjectId: input.sourceProjectId,
    sourceLabel: input.sourceLabel,
    payload: input.payload,
    updateBy,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    deleteAt: null,
  });

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

function buildBranchNameFromTask(title: string, taskId: string) {
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
    .toLowerCase()
    .replace(/[^a-z0-9/_-]+/g, '-')
    .replace(/\/{2,}/g, '/')
    .replace(/^-+|-+$/g, '')
    .replace(/^\/+|\/+$/g, '')
    .slice(0, 120);
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
  return asObject(value);
}

function asObject(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new HttpsError('invalid-argument', 'Payload non valido.');
  }
  return value as Record<string, unknown>;
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
