export const UserPermission = {
  AI: 'AI',
  ADMIN: 'ADMIN',
  SUPERADMIN: 'SUPERADMIN',
  BETA_FEATURES: 'BETA_FEATURES',
} as const;

export type UserPermission = typeof UserPermission[keyof typeof UserPermission];

export const isPermission = (x: unknown): x is UserPermission =>
  Object.values(UserPermission).includes(x as UserPermission);
