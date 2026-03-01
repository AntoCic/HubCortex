import { UserPermission } from '@shared/enums/UserPermission';

function toPermissionSet(value: unknown) {
  if (!Array.isArray(value)) return new Set<string>();
  return new Set(value.map((item) => String(item ?? '').trim()).filter(Boolean));
}

function isAdminLike(permissionSet: Set<string>) {
  return permissionSet.has(UserPermission.ADMIN) || permissionSet.has(UserPermission.SUPERADMIN);
}

export function hasRawPermission(permissions: unknown, requiredPermission: string) {
  const permissionSet = toPermissionSet(permissions);
  return permissionSet.has(String(requiredPermission ?? '').trim());
}

export function canReadProjects(permissions: unknown) {
  const permissionSet = toPermissionSet(permissions);
  if (isAdminLike(permissionSet)) return true;
  return (
    permissionSet.has(UserPermission.PROJECT_READ) ||
    permissionSet.has(UserPermission.PROJECT_WRITE) ||
    permissionSet.has(UserPermission.MANAGE_PROJECT)
  );
}

export function canWriteProjects(permissions: unknown) {
  const permissionSet = toPermissionSet(permissions);
  if (isAdminLike(permissionSet)) return true;
  return permissionSet.has(UserPermission.PROJECT_WRITE) || permissionSet.has(UserPermission.MANAGE_PROJECT);
}

export function canManageGitHub(permissions: unknown) {
  const permissionSet = toPermissionSet(permissions);
  if (isAdminLike(permissionSet)) return true;
  return permissionSet.has(UserPermission.GITHUB_MANAGE);
}

export function hasAppPermission(permissions: unknown, requiredPermission: string) {
  const required = String(requiredPermission ?? '').trim();
  if (!required) return true;

  if (required === UserPermission.PROJECT_READ) {
    return canReadProjects(permissions);
  }

  if (required === UserPermission.PROJECT_WRITE) {
    return canWriteProjects(permissions);
  }

  if (required === UserPermission.GITHUB_MANAGE) {
    return canManageGitHub(permissions);
  }

  return hasRawPermission(permissions, required);
}
