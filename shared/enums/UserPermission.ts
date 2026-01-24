export const UserPermission = {
  SUPERADMIN: 'SUPERADMIN',
  MODAL_DEV_ON: 'MODAL_DEV_ON',
  ADMIN: 'ADMIN',
  OFFLINE_ALLOW: 'OFFLINE_ALLOW',


} as const

// Type union derivato dalle chiavi dell'oggetto
export type UserPermission = typeof UserPermission[keyof typeof UserPermission]

// Type guard per sanificare valori letti dal DB
export const isPermission = (x: unknown): x is UserPermission =>
  Object.values(UserPermission).includes(x as UserPermission)
