import { Timestamp } from 'firebase/firestore'

/* ------------------------------------------------------------------
 * Helpers interni
 * ------------------------------------------------------------------ */

const pad2 = (n: number) => String(n).padStart(2, '0')

function isValidDate(d: unknown): d is Date {
  return d instanceof Date && !isNaN(d.getTime())
}

function toDate(v: unknown): Date | null {
  if (!v) return null
  if (v instanceof Date) return isValidDate(v) ? v : null
  if (v instanceof Timestamp) return v.toDate()
  if (typeof v === 'string' || typeof v === 'number') {
    const d = new Date(v)
    return isValidDate(d) ? d : null
  }
  return null
}

/* ------------------------------------------------------------------
 * DATE / TIME → INPUT
 * ------------------------------------------------------------------ */

/** Timestamp | Date → 'YYYY-MM-DD' (input type="date") */
export function timestampInputDate(v: Timestamp | Date | null | undefined): string {
  const d = toDate(v)
  if (!d) return ''
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

/** Timestamp | Date → 'HH:mm' (input type="time") */
export function timestampInputTime(v: Timestamp | Date | null | undefined): string {
  const d = toDate(v)
  if (!d) return ''
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

/** Timestamp | Date → 'YYYY-MM-DDTHH:mm' (input type="datetime-local") */
export function timestampInputDateTimeLocal(
  v: Timestamp | Date | null | undefined
): string {
  const d = toDate(v)
  if (!d) return ''
  return `${timestampInputDate(d)}T${timestampInputTime(d)}`
}

/* ------------------------------------------------------------------
 * INPUT → DATE / TIMESTAMP
 * ------------------------------------------------------------------ */

/** 'YYYY-MM-DD' → Date (locale) */
export function inputDateToDate(date: string): Date | null {
  if (!date) return null
  const d = new Date(`${date}T00:00:00`)
  return isValidDate(d) ? d : null
}

/** 'YYYY-MM-DD' + 'HH:mm' → Timestamp */
export function inputDateTimeToTimestamp(
  date: string,
  time?: string
): Timestamp | null {
  if (!date) return null
  console.log(time);

  const t = (time && time !== '') ? time : '00:00';
  console.log(`${date}T${t}:00`);
  const d = new Date(`${date}T${t}:00`)
  return isValidDate(d) ? Timestamp.fromDate(d) : null
}

/* ------------------------------------------------------------------
 * GENERIC VALUE → INPUT
 * ------------------------------------------------------------------ */

/** Qualsiasi valore → stringa sicura per input text */
export function valueToInputString(v: unknown, fallback = ''): string {
  if (v === null || v === undefined) return fallback
  return String(v)
}

/** Qualsiasi valore → number | '' (input type="number") */
export function valueToInputNumber(v: unknown): number | '' {
  if (v === null || v === undefined || v === '') return ''
  const n = Number(v)
  return isNaN(n) ? '' : n
}

/** Qualsiasi valore → boolean (input type="checkbox") */
export function valueToInputBoolean(v: unknown): boolean {
  return Boolean(v)
}

/* ------------------------------------------------------------------
 * ARRAY / SELECT UTILS
 * ------------------------------------------------------------------ */

/** Garantisce sempre un array di stringhe (select multiple, tag, ecc.) */
export function valueToStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.map(x => String(x)).filter(Boolean)
}

/** Normalizza value per <select> (evita undefined) */
export function valueToSelect<T extends string>(
  v: unknown,
  allowed?: readonly T[]
): T | '' {
  if (!v) return ''
  const s = String(v) as T
  if (allowed && !allowed.includes(s)) return ''
  return s
}

/* ------------------------------------------------------------------
 * DISPLAY (NON INPUT, MA UTILI IN UI)
 * ------------------------------------------------------------------ */

/** Timestamp | Date → locale string breve */
export function timestampToLocale(
  v: Timestamp | Date | null | undefined,
  locale = undefined
): string {
  const d = toDate(v)
  return d ? d.toLocaleString(locale) : ''
}

/** Stringa vuota → placeholder visivo */
export function emptyToDash(v: unknown): string {
  if (v === null || v === undefined) return '-'
  const s = String(v).trim()
  return s === '' ? '-' : s
}
