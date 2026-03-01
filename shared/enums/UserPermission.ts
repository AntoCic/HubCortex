export const UserPermission = {
  AI: 'AI',
  ADMIN: 'ADMIN',
  SUPERADMIN: 'SUPERADMIN',
  BETA_FEATURES: 'BETA_FEATURES',
  MANAGE_PROJECT: 'MANAGE_PROJECT',
  PROJECT_READ: 'PROJECT_READ',
  PROJECT_WRITE: 'PROJECT_WRITE',
  GITHUB_MANAGE: 'GITHUB_MANAGE',
} as const;

export type UserPermission = typeof UserPermission[keyof typeof UserPermission];

export const isPermission = (x: unknown): x is UserPermission =>
  Object.values(UserPermission).includes(x as UserPermission);
