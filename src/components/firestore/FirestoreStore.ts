// src/components/firestore/FirestoreStore.ts
import { db } from '../../firebase'
import {
  collection, query as fsQuery, orderBy, limit as fsLimit,
  getDocs, getDoc, doc, type QueryConstraint, type FieldPath, type OrderByDirection,
  where,
  documentId,
  onSnapshot,
  type DocumentChange,
  type DocumentData,
} from 'firebase/firestore'
import { fireDebugLog, FirestoreModel } from './FirestoreModel'
import { toast } from '../toast/toastController'
import { isBrowserOffline, MSG_IS_OFFLINE } from '../network/network'
import { optionFireModelDefault, type OptionFireModel } from './FirestoreModel'
import { LS } from '../localStorage/LS'
import { middlewareCatchCall } from './middlewareCatchCall'
import type { Reactive } from 'vue'

function offlineCheck(offlineAllow?: boolean) {
  if (isBrowserOffline()) {
    if (offlineAllow !== true) {
      throw MSG_IS_OFFLINE;
    } else {
      toast.warning(MSG_IS_OFFLINE)
    }
  }
}

export interface GetProps {
  ids?: string[]
  lastByCreate?: number
  lastByUpdate?: number
  query?: QueryConstraint | QueryConstraint[]
  limit?: number
  orderBy?: { fieldPath: string | FieldPath; directionStr?: OrderByDirection }
  forceLocalSet?: boolean // default false
  localSet?: boolean // default true
}

type Ctor<M, D> = { new(data: D): M; collectionName?: string } // ← opzionale

// 🔥 Generic type per store Firestore (pronto per Vue reactive)
export type FirestoreStoreReactive<
  M extends FirestoreModel<D>,
  D extends { id: string }
> = Reactive<FirestoreStore<M, D>>
export type AnyFirestoreStoreReactive = FirestoreStoreReactive<
  FirestoreModel<{ id: string }>,
  { id: string }
>


export class FirestoreStore<
  M extends FirestoreModel<D>,
  D extends { id: string }
> {
  protected readonly ModelInstnce: Ctor<M, D>
  protected makeModel(id: string, data: Omit<D, 'id'>): M {
    return new this.ModelInstnce({ id, ...data } as D);
  }
  /** Se presente, verrà usata al posto di ModelInstnce.collectionName */
  protected readonly _collectionPath?: string

  private debugLog(type: string, ...args: unknown[]) {
    fireDebugLog(this.collectionPath, '🔥📡📦', type, args)
  }

  items: Record<string, M> = {}
  snapshotFnStop: (() => void) | null = null
  isFirstRun: boolean = true
  prevStartQuery: string | null = ''
  get live(): boolean {
    return !!this.snapshotFnStop
  }
  get ref() {
    return collection(db, this.collectionPath)
  }


  constructor(ModelInstnce: Ctor<M, D>, opts?: { collectionPath?: string }) {
    this.ModelInstnce = ModelInstnce
    this._collectionPath = opts?.collectionPath
  }

  /** Path effettiva della collezione di questo store */
  protected get collectionPath(): string {
    const path = this._collectionPath ?? this.ModelInstnce.collectionName
    if (!path) throw new Error('collectionPath non definita')
    return path
  }
  get name(): string {
    return this.collectionPath
  }

  get itemsActive(): Record<string, M> { return Object.fromEntries(Object.entries(this.items).filter(([, m]) => !m.isDeleted)) }
  get itemsDeleted(): Record<string, M> { return Object.fromEntries(Object.entries(this.items).filter(([, m]) => m.isDeleted)) }

  get itemsArray(): M[] { return Object.values(this.items) }
  /** 🔎 Solo elementi NON cancellati (m.deleteAt === null) */
  get itemsActiveArray(): M[] { return Object.values(this.items).filter(m => !m.isDeleted) }
  /** 🧺 Solo elementi cancellati (cestino) */
  get itemsDeletedArray(): M[] { return Object.values(this.items).filter(m => m.isDeleted) }

  get isEmpty(): boolean { return Object.keys(this.items).length === 0 }
  /** 🔎 Versione array: NON cancellati */
  get isActiveEmpty(): boolean { return this.itemsActiveArray.length === 0 }
  /** 🧺 Versione array: cancellati */
  get isDeletedEmpty(): boolean { return this.itemsDeletedArray.length === 0 }

  get localStorageKey() {
    const key = this.ModelInstnce?.prototype?.localStorageKey?.()
    if (!key) {
      toast.logError('Impossibile svuotare LocalStorage: localStorageKey() non definita nel Model.')
      return
    }
    return key
  }
  /**
   * 📅 Restituisce un array ordinato per timestamp scelto.
   * @param option 'createdAt' | 'updatedAt' | 'deleteAt'
   * @returns Array ordinato in ordine discendente (più recente prima)
   */
  itemsArrayOrderedBy(option: 'createdAt' | 'updatedAt' | 'deleteAt', deleted?: boolean): M[] {
    const arr = [...(deleted === undefined ? this.itemsArray : (deleted ? this.itemsDeletedArray : this.itemsActiveArray))]

    return arr.sort((a, b) => {
      const ta = (a[option] as any)?.toMillis?.() ?? 0
      const tb = (b[option] as any)?.toMillis?.() ?? 0
      return tb - ta
    })
  }

  findItemsById(id: string | false | null | undefined) {
    if (!id || id === '') return undefined;
    return this.items?.[id];
  }

  async get(opts: GetProps = {}): Promise<Record<string, M>> {
    this.debugLog('get');
    try {
      const constraints = buildConstraintsFromGetProps(opts);
      const q = constraints
        ? fsQuery(this.ref, ...constraints)
        : this.ref
      const snap = await getDocs(q)

      if (!!opts.forceLocalSet) {
        this.items = {};
        this.localClear();
      }
      for (const d of snap.docs) {
        const instance = this.makeModel(d.id, d.data() as Omit<D, 'id'>)
        const instanceToSet = await instance.onGetBeforeStoreSet(instance);
        this.items[d.id] = instanceToSet
        if (instanceToSet.canLocalSave(opts.localSet) || (!!opts.forceLocalSet && instanceToSet.canLocalSave())) {
          instanceToSet.localSet()
        }
      }

      return this.items;
    } catch (error) {
      middlewareCatchCall(error); throw error
    }
  }


  /**
 * Legge doc per ids usando `documentId() in (...)`
 * Firestore: max 10 elementi per `in` ma gestito fa chiamate a grruppi da 10
 */
  async getIds(ids: string[]): Promise<{ foundIds: string[] | false; notFoundIds: string[] | false }> {
    this.debugLog('getIds');

    const uniqIds = Array.from(new Set((ids ?? []).map(i => (i ?? '').trim()).filter(Boolean)))
    if (uniqIds.length === 0) return { foundIds: false, notFoundIds: false }

    const chunk = <T,>(arr: T[], size: number): T[][] => {
      const out: T[][] = []
      for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
      return out
    }

    const foundIdsSet = new Set<string>();

    const groups = chunk(uniqIds, 10);
    for (const g of groups) {
      const res = await this.get({
        query: where(documentId(), 'in', g),
      })
      for (const id of Object.keys(res)) {
        foundIdsSet.add(id)
      }
    }

    const foundIds = Array.from(foundIdsSet)
    const notFoundIds = uniqIds.filter(id => !foundIdsSet.has(id))

    return {
      foundIds: foundIds.length > 0 ? foundIds : false,
      notFoundIds: notFoundIds.length > 0 ? notFoundIds : false,
    }
  }


  public localGet(): void {
    const key = this.localStorageKey
    try {
      if (!key) {
        toast.logError({ title: 'localGet ' + key, message: `LocalStorageKey not found` })
        return
      }
      const docs = LS.getParsed(key)
      for (const id in docs) {
        this.items[id] = this.makeModel(id, docs[id])
      }
    } catch (error) {
      toast.logError({ title: 'localGet ' + key, message: `errore try parse o makeModel` })
    }
  }

  /**
  * 🔴 Avvia il listening realtime (onSnapshot) sulla collection gestita dallo store.
  *
  * Questo metodo mette lo store in modalità "live", mantenendo sincronizzati
  * gli `items` locali con Firestore in tempo reale.
  *
  * ⚠️ Non modifica la logica esistente di `get()`:
  * - `start()` serve solo per l'ascolto realtime
  * - `get()` resta una fetch one-shot
  *
  */
  async start(opts: GetProps = {}): Promise<void> {
    this.debugLog('👂 start')
    if (!validateQueryGetOpts(opts)) return;

    const currentQueryKey = JSON.stringify(
      [opts.ids, opts.query, opts.limit, opts.orderBy].map(c => (c as any)?.toString?.() ?? String(c))
    )

    if (this.live && this.prevStartQuery === currentQueryKey) return
    this.stop();
    this.prevStartQuery = currentQueryKey

    const constraints = buildConstraintsFromGetProps(opts, true);
    const q = constraints
      ? fsQuery(this.ref, ...constraints)
      : this.ref


    this.snapshotFnStop = onSnapshot(
      q,
      async (snap) => {
        const snapDocs = snap.docChanges();
        if (this.isFirstRun) {
          this.debugLog('👂 firstRun')
          this.isFirstRun = false
          this.onStartFirstRun(snapDocs, opts.forceLocalSet)
          if (opts.forceLocalSet) {
            this.items = {}
            this.localClear()
          }
        }
        for (const change of snapDocs) {
          const id = change.doc.id

          if (change.type === 'removed') {
            this.items[id]?.localSet(true);
            delete this.items[id]
            continue
          }
          const docData = change.doc.data() as Omit<D, 'id'>
          const instance = this.makeModel(id, docData)

          const instanceToSet = await instance.onGetBeforeStoreSet(instance)
          this.items[id] = instanceToSet

          if (instanceToSet.canLocalSave(opts.localSet)) {
            instanceToSet.localSet()
          }
        }
      },
      (error) => {
        this.stop()
        middlewareCatchCall(error)
      }
    )
  }
  onStartFirstRun(
    snapDocs: DocumentChange<DocumentData, DocumentData>[],
    forceLocalSet?: boolean
  ): void {
    void snapDocs;
    void forceLocalSet;
  }

  stop(): void {
    if (this.snapshotFnStop) {
      this.debugLog('🛑 stop');
      this.prevStartQuery = null
      this.snapshotFnStop()
      this.snapshotFnStop = null
      this.isFirstRun = true
    }
  }


  async add(data: Omit<D, 'id'>, options?: Omit<OptionFireModel, 'touchUpdate'>): Promise<M>;
  async add(data: Omit<D, 'id'> & { id?: string }, options?: Omit<OptionFireModel, 'touchUpdate'>): Promise<M>;
  async add(
    data: Omit<D, 'id'> & { id?: string },
    {
      offlineAllow = optionFireModelDefault.offlineAllow,
      localSet = optionFireModelDefault.localSet,
    }: Omit<OptionFireModel, 'touchUpdate'> = optionFireModelDefault
  ): Promise<M> {
    try {
      this.debugLog('add');
      offlineCheck(offlineAllow)

      const { id, ...rest } = (data as any)
      const sanitized = FirestoreModel.stripUndefinedDeep(rest) as Omit<D, 'id'>
      let _id: string = id ?? ''
      if (id) {
        const checkRef = doc(db, this.collectionPath, id)
        const existsSnap = await getDoc(checkRef)
        if (existsSnap.exists()) throw new Error('Documento già esistente')
      } else {
        // genero un id senza scrivere ancora nulla
        const newDoc = doc(this.ref)
        _id = newDoc.id
      }

      const instance = this.makeModel(_id, sanitized)
      await instance.save({ offlineAllow, touchUpdate: true, localSet })
      this.items[_id] = instance
      return instance
    } catch (error) {
      middlewareCatchCall(error); throw error
    }
  }

  async delete(id: string, opts: Omit<OptionFireModel, 'touchUpdate'> = optionFireModelDefault): Promise<void> {
    try {
      if (this.items[id]) {
        const prom = this.items[id].deleteJustOnline_NotLocalStore(opts)
        delete this.items[id]
        return await prom
      }
    } catch (error) {
      middlewareCatchCall(error); throw error
    }
  }


  findByUid(uid: string) {
    if (!this.itemsArray || !this.itemsArray.length) return undefined
    return this.itemsArray.find((f: any) => f.uid === uid)
  }

  /**
   * Legge un singolo documento da Firestore e aggiorna items[id].
   * Ritorna l'istanza oppure undefined se non esiste.
   */
  async getOne(id: string, options?: OptionFireModel): Promise<M | undefined> {
    this.debugLog('getOne');
    try {
      const ref = doc(db, this.collectionPath, id);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        // opzionale: se esiste localmente, lo rimuovo perché è stato cancellato su server
        if (this.items[id]) delete this.items[id];
        throw new Error("[404] non trovato"); // se ti da fastidio questo errore aggiungi una prop a [options?: OptionFireModel] per gestire il caso in cui non vuoi visualizare l'errore. puoi ritornare semplicemente undefined
      }

      const data = snap.data() as Omit<D, 'id'>;

      const instance = this.makeModel(id, data);
      const instanceToSet = await instance.onGetBeforeStoreSet(instance);

      // upsert in cache locale
      this.items[id] = instanceToSet;
      // 🔗 sync LS opzionale
      if (instanceToSet.canLocalSave(options?.localSet)) {
        instanceToSet.localSet()
      }
      return instanceToSet;
    } catch (error: any) {
      middlewareCatchCall(error); throw error
    }
  }

  /**
   * Ritorna l'istanza se già presente nello store, altrimenti la carica da Firestore.
   */
  async ensureOne(id: string): Promise<M | undefined> {
    const existing = this.items[id];
    if (existing) return existing;
    return this.getOne(id);
  }


  /** 🧹 Svuota completamente il LocalStorage associato al Model gestito dallo store */
  public localClear(): void {
    const key = this.localStorageKey

    if (LS.has(key)) {
      LS.remove(key)
      toast.log(`LocalStorage "${key}" svuotato con successo.`)
    } else {
      toast.log(`Nessun dato trovato per LocalStorage "${key}".`)
    }
  }
}

export function validateQueryGetOpts(opts: GetProps & { ids?: string[] }): boolean {
  // --- ids vs query --------------------------------------------------
  if (opts.ids && opts.ids.length > 0) {
    if (opts.ids.length > 10) {
      toast.logError('Non puoi lanciare start con più di 10 id')
      return false
    }
    if (opts.query) {
      toast.logError('Non è supportato usare "query" insieme a "ids" in start()')
      return false
    }
  }
  // --- lastByCreate / lastByUpdate ----------------------------------
  if (opts.lastByCreate || opts.lastByUpdate) {
    if (opts.lastByCreate && opts.lastByUpdate) {
      toast.logError('Non puoi usare lastByCreate e lastByUpdate insieme')
      return false
    }
    if (opts.limit || opts.orderBy) {
      toast.logError('Non puoi usare limit o orderBy insieme a lastByCreate / lastByUpdate')
      return false
    }
  }
  return true
}

export function buildConstraintsFromGetProps(opts: GetProps, alredyCheck: boolean = false): QueryConstraint[] | false {
  if (!alredyCheck) {
    if (!validateQueryGetOpts(opts)) return false
  }
  const constraints: QueryConstraint[] = []

  // --- ids / query ---------------------------------------------------
  if (opts.ids && opts.ids.length > 0) {
    const ids = Array.from(new Set(opts.ids.map(i => (i ?? '').trim()).filter(Boolean)))

    if (ids.length === 1) {
      constraints.push(where(documentId(), '==', ids[0]))
    } else if (ids.length > 1) {
      constraints.push(where(documentId(), 'in', ids))
    }
  } else {
    if (opts.query) {
      constraints.push(...(Array.isArray(opts.query) ? opts.query : [opts.query]))
    }
  }

  // --- lastByCreate / lastByUpdate ----------------------------------
  if (opts.lastByCreate) {
    constraints.push(orderBy('createdAt', 'desc'))
    constraints.push(fsLimit(opts.lastByCreate))
    return constraints
  }

  if (opts.lastByUpdate) {
    constraints.push(orderBy('updatedAt', 'desc'))
    constraints.push(fsLimit(opts.lastByUpdate))
    return constraints
  }

  if (opts.orderBy) constraints.push(orderBy(opts.orderBy.fieldPath, opts.orderBy.directionStr ?? 'asc'))
  if (opts.limit) constraints.push(fsLimit(opts.limit))

  return constraints
}
