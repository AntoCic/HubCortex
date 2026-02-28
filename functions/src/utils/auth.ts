import type { CallableRequest } from 'firebase-functions/v2/https';
import { HttpsError } from 'firebase-functions/v2/https';
import { db } from '../config/firebaseAdmin.js';

export function requireAuth(request: CallableRequest<unknown>) {
  if (!request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'Autenticazione richiesta.');
  }

  return request.auth.uid;
}

export async function requireUserPermission(request: CallableRequest<unknown>, requiredPermission: string) {
  const uid = requireAuth(request);

  if (hasPermissionInToken(request, requiredPermission)) {
    return;
  }

  const userDoc = await db.collection('users').doc(uid).get();
  const permissions = normalizePermissions(userDoc.get('permissions'));

  if (permissions.includes(requiredPermission)) {
    return;
  }

  throw new HttpsError('permission-denied', `Permesso richiesto: ${requiredPermission}.`);
}

function hasPermissionInToken(request: CallableRequest<unknown>, requiredPermission: string) {
  const token = request.auth?.token as Record<string, unknown> | undefined;
  const permissions = normalizePermissions(token?.permissions);
  return permissions.includes(requiredPermission);
}

function normalizePermissions(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => String(item ?? '').trim()).filter(Boolean);
}
