import { LocalStorageKey, type LocalStorageKey as LocalStorageKeyType, LocalStorageClearAll } from "@shared/enums/LocalStorageKey"
import { toast } from "../toast/toastController"

function safeParse(str: string, key?: string) {
  try {
    return JSON.parse(str)
  } catch {
    toast.logError(`Errore${key ? ' "' + key + '"' : ''} nel JSON.parse`)
    return undefined
  }
}

/**
 * Wrapper per localStorage robusto e tipizzato
 */
export const LS = {
  /** Lettura con gestione errori, valore  */
  getStr(key: LocalStorageKeyType): string | undefined {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return undefined
    }
    return raw
  },

  /** Lettura con gestione errori, valore  */
  getParsed(key: LocalStorageKeyType): any {
    const val = this.getStr(key)
    if (!val) return val;
    return safeParse(val, key)
  },

  /** Scrittura sicura con serializzazione JSON */
  set(key: LocalStorageKeyType, value: any): any {
    try {
      const _value = JSON.stringify(value);
      localStorage.setItem(key, _value);
      return _value
    } catch (e: any) {
      const msg =
        e?.name === "QuotaExceededError"
          ? "Spazio di archiviazione locale esaurito"
          : `Errore nel salvataggio di "${key}"`
      toast.logError(msg)
      return null
    }
  },

  /** Aggiorna un valore esistente */
  update(key: LocalStorageKeyType, data: any) {
    const existing = this.getParsed(key);
    if (Array.isArray(existing)) {
      existing.push(data);
      return this.set(key, existing);
    }

    if (existing && typeof existing === 'object') {
      return this.set(key, { ...existing, ...data });
    }

    toast.logError('Devi usare set. typeof existing non è un object o array');
    return existing;
  },


  /** Aggiunge uno o più elementi a un array salvato in localStorage */
  push(key: LocalStorageKeyType, ...items: any[]) {
    const existing = this.getParsed(key);

    if (!Array.isArray(existing)) {
      toast.logError(`push fallito: "${key}" non è un array`);
      return existing;
    }

    existing.push(...items);
    return this.set(key, existing);
  },

  /** Rimozione sicura */
  remove(key: LocalStorageKeyType): void {
    try {
      localStorage.removeItem(key)
    } catch {
      toast.logError(`Errore nella rimozione di "${key}"`)
    }
  },

  /** Alias compatibile (ma corretto) */
  delete(key: LocalStorageKeyType): void {
    this.remove(key)
  },

  /** Verifica se una chiave esiste */
  has(key: LocalStorageKeyType): boolean {
    try {
      return localStorage.getItem(key) !== null
    } catch {
      return false
    }
  },

  /** Elenca tutte le chiavi conosciute (solo quelle definite in LocalStorageKey) */
  keys(): LocalStorageKeyType[] {
    return Object.values(LocalStorageKey)
  },

  /** Svuota solo le chiavi definite nel tuo enum (usa la tua funzione esistente) */
  clearAll(): void {
    try {
      LocalStorageClearAll()
      toast.log("Local storage vuoto")
    } catch {
      toast.logError("Errore nel pulire lo storage")
    }
  },

  /** Migra il valore da una chiave a un’altra */
  migrate(oldKey: LocalStorageKeyType, newKey: LocalStorageKeyType): void {
    const val = this.getStr(oldKey)
    if (val !== undefined) {
      this.set(newKey, val)
      this.remove(oldKey)
    }
  },
}
