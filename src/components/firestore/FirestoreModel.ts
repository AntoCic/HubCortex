// src/components/firestore/FirestoreModel.ts
import { db } from '../../firebase'
import {
  doc,
  setDoc,
  updateDoc,
  getDoc,
  DocumentReference,
  deleteField,
  deleteDoc,
  Timestamp,
  FieldValue,
} from 'firebase/firestore'
import { toast } from '../toast/toastController'
import { isBrowserOffline, MSG_IS_OFFLINE } from '../network/network'
import type { LocalStorageKey } from '@shared/enums/LocalStorageKey'
import { LS } from '../localStorage/LS'
import { reviveTimestamp, serializeTimestamp } from '../timestamp/parseTimestamp'
import { middlewareCatchCall } from './middlewareCatchCall'

type FirestoreStore_delete = {
  delete: (id: string, opts?: Omit<OptionFireModel, 'touchUpdate'>) => Promise<void>
}

export function fireDebugLog(
  collectionPath: string,
  icons: string,
  type: string,
  ...args: unknown[]
): void {
  const DEBUGGER_LOG = (collectionName: string | undefined) => {
    if (!collectionName) return

    // const collection: string[] = ['appConfig']
    // return collection.length > 0 ? collection.includes(collectionName) : false

    return true

    return false
  };
  if (!DEBUGGER_LOG(collectionPath)) return
  console.log(`${icons}[${type}] [${collectionPath ?? 'no collectionName'}]`, ...args)
}

function offlineCheck(offlineAllow?: boolean) {
  if (isBrowserOffline()) {
    if (offlineAllow !== true) {
      throw MSG_IS_OFFLINE
    } else {
      toast.warning(MSG_IS_OFFLINE)
    }
  }
}

export type Timestampble = {
  createdAt: Timestamp
  updatedAt: Timestamp
  deleteAt: Timestamp | null
}

export type OptionFireModel = {
  offlineAllow?: boolean;
  touchUpdate?: boolean;
  localSet?: boolean;
}
export const optionFireModelDefault: OptionFireModel = {
  offlineAllow: false,
  touchUpdate: true,
  localSet: true,
}

export abstract class FirestoreModel<T extends { id: string }> {
  public id: string
  public createdAt: Timestamp
  public updatedAt: Timestamp
  public deleteAt: Timestamp | null

  protected constructor(data: T & Partial<Timestampble>) {
    this.id = data.id
    Object.assign(this, data)

    const now = Timestamp.now();
    this.createdAt = data.createdAt ? reviveTimestamp(data.createdAt) : now;
    this.updatedAt = data.updatedAt ? reviveTimestamp(data.updatedAt) : now;
    this.deleteAt = (data.deleteAt && data.deleteAt !== null) ? reviveTimestamp(data.deleteAt) : null;
  }

  static collectionName?: string

  private debugLog(type: string, ...args: unknown[]) {
    fireDebugLog((this as any)?.collectionName ?? 'no-collectionName', '🔥📡🏪', type, args)
  }

  /**
   * Facoltativo: i model figli possono override-are questo metodo
   * per fornire la path dinamica di collezione (es. subcollection).
   * Esempio: "debits/{parentId}/transitions"
   */
  protected getCollectionPath?(): string;

  protected localStorageKey?(): LocalStorageKey

  /**
   * Ritorna la DocumentReference calcolando:
   * - se il model ha getCollectionPath(): la usa
   * - altrimenti usa la static collectionName.
   */
  public get ref(): DocumentReference {
    const self = this.constructor as typeof FirestoreModel
    const dynPath = (this as any).getCollectionPath?.()
    const col = dynPath ?? (self as any).collectionName
    if (!col) {
      throw new Error(
        `${self.name}: nessuna collectionName statica e nessuna getCollectionPath() definita.`,
      )
    }
    return doc(db, col, this.id)
  }

  abstract toData(): T

  /**
   * GET singolo documento.
   */
  static async get<U extends FirestoreModel<T>, T extends { id: string }>(
    this: { new(data: T): U; collectionName?: string },
    id: string,
    opts?: { collectionPath?: string, localSet?: boolean },
  ): Promise<U | undefined> {
    try {
      fireDebugLog((this as any)?.collectionName ?? 'no-collectionName', '🔥📡🏪', 'get')
      const col = opts?.collectionPath ?? (this as any).collectionName
      if (!col) {
        throw new Error(
          `${this.name}.get: serve opts.collectionPath per collezioni dinamiche, oppure definisci static collectionName.`,
        )
      }

      const ref = doc(db, col, id)
      const snap = await getDoc(ref)
      if (!snap.exists()) return undefined

      const instance = new this({ id, ...(snap.data() as any) });
      const instanceToSet = await instance.onGetBeforeStoreSet(instance);

      if (instanceToSet.canLocalSave(opts?.localSet)) instanceToSet.localSet();
      return instanceToSet
    } catch (error) {
      middlewareCatchCall(error); throw error
    }
  }

  static cleanDataAAA(data: any) {
    return Object.fromEntries(
      Object.entries(data).map(([key, value]: [string, any]) => {
        if (value === undefined || value === null) {
          return [key, deleteField()]
        }

        if (
          typeof value === 'object' &&
          value !== null &&
          !(value instanceof Timestamp) &&
          !(value instanceof Date)
        ) {
          try {
            return [key, structuredClone(value)]
          } catch {
            return [key, JSON.parse(JSON.stringify(value))]
          }
        }
        return [key, value]
      }),
    )
  }

  private static isPlainObject(v: any): v is Record<string, any> {
    return !!v && typeof v === 'object'
  }

  /**
   * Rimuove ricorsivamente gli `undefined` annidati (Firestore non li supporta).
   * NON trasforma null in deleteField: quello lo fai a top-level.
   */
  static stripUndefinedDeep(value: any): any {
    if (value === undefined) return undefined
    if (value === null) return null

    // Non toccare tipi "speciali"
    if (
      value instanceof Timestamp ||
      value instanceof Date ||
      value instanceof FieldValue
    ) {
      return value
    }

    if (Array.isArray(value)) {
      // Firestore non ama undefined negli array -> li rimuoviamo
      return value
        .map((v) => FirestoreModel.stripUndefinedDeep(v))
        .filter((v) => v !== undefined)
    }

    if (FirestoreModel.isPlainObject(value)) {
      const out: Record<string, any> = {}
      for (const [k, v] of Object.entries(value)) {
        const cleaned = FirestoreModel.stripUndefinedDeep(v)
        if (cleaned !== undefined) out[k] = cleaned
      }
      return out
    }

    return value
  }

  static cleanData(data: any) {
    // 1) prima pulizia deep per eliminare undefined annidati
    const deepCleaned = FirestoreModel.stripUndefinedDeep(data)

    // 2) mapping top-level: undefined/null => deleteField()
    const out = Object.fromEntries(
      Object.entries(deepCleaned ?? {}).map(([key, value]: [string, any]) => {
        if (value === undefined || value === null) {
          return [key, deleteField()]
        }

        // Se è oggetto "normale" o array, cloniamo per sicurezza
        if (
          (FirestoreModel.isPlainObject(value) || Array.isArray(value)) &&
          !(value instanceof Timestamp) &&
          !(value instanceof Date) &&
          !(value instanceof FieldValue)
        ) {
          try {
            return [key, structuredClone(value)]
          } catch {
            return [key, JSON.parse(JSON.stringify(value))]
          }
        }

        return [key, value]
      }),
    )

    return out
  }

  async onGetBeforeStoreSet<U extends FirestoreModel<T>>(instance: U): Promise<U> {
    return instance
  }

  async save({
    offlineAllow = optionFireModelDefault.offlineAllow,
    touchUpdate = optionFireModelDefault.touchUpdate,
    localSet = optionFireModelDefault.localSet
  }: OptionFireModel = optionFireModelDefault): Promise<void> {
    this.debugLog('save')
    try {
      offlineCheck(offlineAllow)
      const data = this.toData()
      const cleaned = FirestoreModel.cleanData(data);
      if (touchUpdate && !cleaned.updatedAt) {
        cleaned.updatedAt = this.touchUpdated();
      }
      await setDoc(this.ref, { ...cleaned }, { merge: true })
      if (this.canLocalSave(localSet)) this.localSet();
    } catch (error) {
      middlewareCatchCall(error); throw error
    }
  }

  async update(data: Partial<Omit<T, 'id'>>, {
    offlineAllow = optionFireModelDefault.offlineAllow,
    touchUpdate = optionFireModelDefault.touchUpdate,
    localSet = optionFireModelDefault.localSet
  }: OptionFireModel = optionFireModelDefault): Promise<void> {
    this.debugLog('update')
    try {
      offlineCheck(offlineAllow);
      const cleaned = FirestoreModel.cleanData(data);
      if (touchUpdate && !cleaned.updatedAt) {
        cleaned.updatedAt = this.touchUpdated();
      }
      await updateDoc(this.ref, cleaned as any)
      Object.assign(this, data)
      if (this.canLocalSave(localSet)) this.localSet();
    } catch (error) {
      middlewareCatchCall(error); throw error
    }
  }

  async delete(store: FirestoreStore_delete, opts: Omit<OptionFireModel, 'touchUpdate'> = optionFireModelDefault): Promise<void> {
    this.debugLog('deleteUsingStore', `[id=${this.id}]`)
    return await store.delete(this.id, opts)
  }

  async deleteJustOnline_NotLocalStore({
    offlineAllow = optionFireModelDefault.offlineAllow,
    localSet = optionFireModelDefault.localSet
  }: Omit<OptionFireModel, 'touchUpdate'> = optionFireModelDefault): Promise<void> {
    this.debugLog('delete')
    try {
      offlineCheck(offlineAllow)
      await deleteDoc(this.ref)
      if (this.canLocalSave(localSet)) this.localSet(true);
    } catch (error) {
      middlewareCatchCall(error); throw error
    }
  }

  // utilities
  get isDeleted(): boolean {
    return this.deleteAt !== null
  }
  timestampbleProps(): Timestampble {
    return {
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deleteAt: this.deleteAt,
    }
  }

  touchUpdated(): Timestamp {
    const now = Timestamp.now();
    this.updatedAt = now;
    return now;
  }

  async softDelete(optionFireModel?: OptionFireModel): Promise<void> {
    this.debugLog('softDelete')
    if (this.deleteAt !== null) {
      toast.warning('Elemento già nel cestino.')
      return
    }
    const when = Timestamp.now()
    this.deleteAt = when
    await this.update({ deleteAt: when } as any, optionFireModel)
  }

  /** 🔄 Ripristina dal cestino (se supportato) */
  async restore(optionFireModel?: OptionFireModel): Promise<void> {
    this.debugLog('restore')
    if (this.deleteAt === null) {
      toast.warning('Elemento non è nel cestino.')
      return
    }
    ; this.deleteAt = null
    // non forzare null se non supportato: il check iniziale lo impedisce
    await this.update({ deleteAt: null } as any, optionFireModel)
  }

  /** Ritorna true se il model espone una chiave valido per il salvataggio su LocalStorage */
  canLocalSave(localSet?: boolean): boolean {
    if (localSet === false) return false
    try {
      return !!(this?.localStorageKey?.())
    } catch {
      return false
    }
  }

  /** Salva/aggiorna questo documento nel LocalStorage, sotto l’oggetto indicizzato per id */
  public localSet(_delete?: boolean): void {
    this.debugLog('localSet')
    const key = this?.localStorageKey?.()
    if (!key) return

    const payloadRaw = this?.toData?.() ?? { id: this.id }
    const payload = serializeTimestamp(payloadRaw)

    const existing = LS.getParsed(key)
    if (existing && typeof existing === 'object' && !Array.isArray(existing)) {
      if (_delete) {
        if (existing[this.id]) {
          delete existing[this.id]
          LS.set(key, existing)
        }
        return
      }
      LS.set(key, { ...existing, [this.id]: payload })
    } else {
      LS.set(key, { [this.id]: payload })
    }
  }
}
