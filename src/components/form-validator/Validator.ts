import type { RuleFn } from "./FormValidator"

export const required = (msg = 'Obbligatorio'): RuleFn<any> => (v) => {
  if (v === null || v === undefined) return msg
  if (typeof v === 'string' && v.trim().length === 0) return msg
  if (Array.isArray(v) && v.length === 0) return msg
  return null
}

export const email = (msg = 'Email non valida'): RuleFn<string> => (v) => {  
  return !v ? null : (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : msg)
}

export const dateISO = (msg = 'Formato richiesto: AAAA-MM-GG'): RuleFn<string> => (v) =>
  !v ? null : (/^\d{4}-\d{2}-\d{2}$/.test(v) ? null : msg)

export const url = (msg = 'URL non valido'): RuleFn<string> => (v) => {
  if (!v) return null
  try { new URL(v); return null } catch { return msg }
}

export const oneOf = <V extends string>(choices: readonly V[], msg = 'Seleziona un’opzione'): RuleFn<V | undefined> => (v) => {
  return !v ? null : (choices as readonly string[]).includes(v) ? null : msg;
}

export const requiredTrue = (msg = 'Devi accettare'): RuleFn<boolean> => (v) => v ? null : msg

/* ---------- Validatori numerici ---------- */

/** Deve essere un numero valido */
export const isNumber = (msg = 'Deve essere un numero'): RuleFn<any> => (v) => {
  if (v === null || v === undefined || v === '') return null // lascia required gestire
  return isNaN(Number(v)) ? msg : null
}

/** Numero minimo (incluso) */
export const minNumber = (min: number, msg?: string): RuleFn<number | string> => (v) => {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  if (isNaN(n)) return msg ?? `Deve essere un numero`
  return n < min ? msg ?? `Il numero deve essere ≥ ${min}` : null
}

/** Numero massimo (incluso) */
export const maxNumber = (max: number, msg?: string): RuleFn<number | string> => (v) => {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  if (isNaN(n)) return msg ?? `Deve essere un numero`
  return n > max ? msg ?? `Il numero deve essere ≤ ${max}` : null
}

/* ---------- Validatori di lunghezza ---------- */

/** Lunghezza minima stringa */
export const minLength = (min: number, msg?: string): RuleFn<string> => (v) => {
  if (!v) return null
  return v.length < min ? msg ?? `Minimo ${min} caratteri` : null
}

/** Lunghezza massima stringa */
export const maxLength = (max: number, msg?: string): RuleFn<string> => (v) => {
  if (!v) return null
  return v.length > max ? msg ?? `Massimo ${max} caratteri` : null
}

/* ---------- Validatore password ---------- */

const regexPassword = /^(?=.*[A-Z])(?=.*\d)(?!.*\s).+$/
// Richiede almeno una maiuscola, almeno una cifra, nessuno spazio
export const password = (msg = 'La password deve contenere almeno una maiuscola, un numero e nessuno spazio'): RuleFn<string> => (v) => {
  if (!v) return null
  return regexPassword.test(v) ? null : msg
}

/** Password con lunghezza minima */
export const passwordWithMin = (min: number, msg?: string): RuleFn<string> => (v) => {
  if (!v) return null
  if (v.length < min) return msg ?? `La password deve avere almeno ${min} caratteri`
  return regexPassword.test(v)
    ? null
    : msg ?? 'La password deve contenere almeno una maiuscola, un numero e nessuno spazio'
}

/** Conferma password: deve coincidere con la password originale */
export const passwordRetype = (
  getOriginal: () => string | null | undefined,
  msg = 'Le password non coincidono'
): RuleFn<string> => (v) => {
  if (!v) return null
  const orig = getOriginal() ?? ''
  return v === orig ? null : msg
}


/** Controlla che il valore sia una data valida ISO o Date */
function parseDate(v: string | Date | null | undefined): Date | null {
  if (!v) return null
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    const d = new Date(v + 'T00:00:00')
    return isNaN(d.getTime()) ? null : d
  }
  return null
}

/** Deve essere dopo (>=) una data di riferimento */
export const dateAfter = (
  getMin: () => string | Date | null | undefined,
  msg = 'La data deve essere successiva'
): RuleFn<string> => (v) => {
  if (!v) return null
  const d = parseDate(v)
  const min = parseDate(getMin())
  if (!d || !min) return null
  return d >= min ? null : msg
}

/** Deve essere prima (<=) di una data di riferimento */
export const dateBefore = (
  getMax: () => string | Date | null | undefined,
  msg = 'La data deve essere precedente'
): RuleFn<string> => (v) => {
  if (!v) return null
  const d = parseDate(v)
  const max = parseDate(getMax())
  if (!d || !max) return null
  return d <= max ? null : msg
}

/** Deve essere compresa tra due date (inclusi) */
export const dateBetween = (
  getMin: () => string | Date | null | undefined,
  getMax: () => string | Date | null | undefined,
  msg = 'La data deve essere compresa nell’intervallo'
): RuleFn<string> => (v) => {
  if (!v) return null
  const d = parseDate(v)
  const min = parseDate(getMin())
  const max = parseDate(getMax())
  if (!d || !min || !max) return null
  return d >= min && d <= max ? null : msg
}
