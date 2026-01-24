export const LS_keyModel = {
  appConfig: 'appConfig',
} as const
export type LSkeyModel = typeof LS_keyModel[keyof typeof LS_keyModel]

export const LS_keyToDelete = {
  ...LS_keyModel,
  currentUser: 'currentUser',
} as const
export type LSkeyToDelete = typeof LS_keyToDelete[keyof typeof LS_keyToDelete]

// MAIN key
export const LocalStorageKey = {
  ...LS_keyToDelete,
  storeDebugMod: 'storeDebugMod',
  lastLoginCurrentUser: 'lastLoginCurrentUser',

} as const

export const LS_keyNotToDelete = [] as readonly LSkeyToDelete[]


// Type union derivato dalle chiavi dell'oggetto
export type LocalStorageKey = typeof LocalStorageKey[keyof typeof LocalStorageKey]

export const LocalStorageKeys = Object.values(LocalStorageKey)

// util
export function LocalStorageClearAll() {
  Object.values(LocalStorageKey).forEach(k => localStorage.removeItem(k))
}
