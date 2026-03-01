import type { CallableRequest } from 'firebase-functions/v2/https';
import { HttpsError } from 'firebase-functions/v2/https';
import { db } from '../config/firebaseAdmin.js';

const PERMISSION_ADMIN = 'ADMIN';
const PERMISSION_SUPERADMIN = 'SUPERADMIN';
const PERMISSION_MANAGE_PROJECT = 'MANAGE_PROJECT';
const PERMISSION_PROJECT_READ = 'PROJECT_READ';
const PERMISSION_PROJECT_WRITE = 'PROJECT_WRITE';
const PERMISSION_GITHUB_MANAGE = 'GITHUB_MANAGE';

export function requireAuth(request: CallableRequest<unknown>) {
  if (!request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'Autenticazione richiesta.');
  }

  return request.auth.uid;
}

export async function requireUserPermission(request: CallableRequest<unknown>, requiredPermission: string) {
  const uid = requireAuth(request);
  const required = expandRequiredPermissions(String(requiredPermission ?? '').trim());

  if (hasPermissionInToken(request, required)) {
    return;
  }

  const userDoc = await db.collection('users').doc(uid).get();
  const permissions = normalizePermissions(userDoc.get('permissions'));

  if (hasAnyPermission(permissions, required)) {
    return;
  }

  throw new HttpsError('permission-denied', `Permesso richiesto: ${requiredPermission}.`);
}

export async function requireProjectReadPermission(request: CallableRequest<unknown>) {
  await requireUserPermission(request, PERMISSION_PROJECT_READ);
}

export async function requireProjectWritePermission(request: CallableRequest<unknown>) {
  await requireUserPermission(request, PERMISSION_PROJECT_WRITE);
}

export async function requireGitHubManagePermission(request: CallableRequest<unknown>) {
  await requireUserPermission(request, PERMISSION_GITHUB_MANAGE);
}

function hasPermissionInToken(request: CallableRequest<unknown>, requiredPermissions: string[]) {
  const token = request.auth?.token as Record<string, unknown> | undefined;
  const permissions = normalizePermissions(token?.permissions);
  return hasAnyPermission(permissions, requiredPermissions);
}

function normalizePermissions(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => String(item ?? '').trim()).filter(Boolean);
}

function hasAnyPermission(userPermissions: string[], requiredPermissions: string[]) {
  return requiredPermissions.some((permission) => userPermissions.includes(permission));
}

function expandRequiredPermissions(requiredPermission: string) {
  const set = new Set<string>([requiredPermission]);

  if (requiredPermission === PERMISSION_PROJECT_READ) {
    set.add(PERMISSION_PROJECT_WRITE);
    set.add(PERMISSION_MANAGE_PROJECT);
  }

  if (requiredPermission === PERMISSION_PROJECT_WRITE) {
    set.add(PERMISSION_MANAGE_PROJECT);
  }

  set.add(PERMISSION_ADMIN);
  set.add(PERMISSION_SUPERADMIN);

  return [...set].filter(Boolean);
}
