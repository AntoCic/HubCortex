import { Timestamp } from 'firebase/firestore'

/** Range default: ultimi 365 giorni fino ad adesso */
export const _defaultRange = {
    from: () => new Date(Date.now() - 1000 * 60 * 60 * 24 * 365),
    to: () => new Date(),
}

type DateRangeInput = {
    from?: Date | Timestamp | string | number
    to?: Date | Timestamp | string | number
}

const pad2 = (n: number) => String(n).padStart(2, '0')

function toDate(v: unknown): Date | null {
    if (v === null || v === undefined) return null
    if (v instanceof Date) return isNaN(v.getTime()) ? null : v
    if (v instanceof Timestamp) return v.toDate()
    if (typeof v === 'string' || typeof v === 'number') {
        const d = new Date(v)
        return isNaN(d.getTime()) ? null : d
    }
    return null
}

function resolveRange(range?: DateRangeInput): { from: Date; to: Date } {
    const fallbackFrom = _defaultRange.from()
    const fallbackTo = _defaultRange.to()

    const from = toDate(range?.from) ?? fallbackFrom
    const to = toDate(range?.to) ?? fallbackTo

    const a = from.getTime()
    const b = to.getTime()
    if (isNaN(a) || isNaN(b)) return { from: fallbackFrom, to: fallbackTo }

    // se invertito, swap
    return a <= b ? { from, to } : { from: to, to: from }
}

function randInt(min: number, max: number): number {
    // inclusivo
    const a = Math.ceil(min)
    const b = Math.floor(max)
    return Math.floor(Math.random() * (b - a + 1)) + a
}

function randMs(from: Date, to: Date): number {
    const a = from.getTime()
    const b = to.getTime()
    return a + Math.random() * (b - a)
}

/* ------------------------------------------------------------------
 * Generatori principali
 * ------------------------------------------------------------------ */

/** Date casuale in un range (default: ultimi 365 giorni → oggi) */
export function dateCasuale(range?: DateRangeInput): Date {
    const { from, to } = resolveRange(range)
    return new Date(randMs(from, to))
}

/** Timestamp Firestore casuale in un range */
export function timestampCasuale(range?: DateRangeInput): Timestamp {
    return Timestamp.fromDate(dateCasuale(range))
}

/** Milliseconds (epoch) casuali in un range */
export function msCasuali(range?: DateRangeInput): number {
    const { from, to } = resolveRange(range)
    return Math.floor(randMs(from, to))
}

/* ------------------------------------------------------------------
 * Date/time per input HTML
 * ------------------------------------------------------------------ */

/** 'YYYY-MM-DD' da una Date */
export function dateToInputDate(d: Date): string {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

/** 'HH:mm' da una Date */
export function dateToInputTime(d: Date): string {
    return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

/** 'YYYY-MM-DDTHH:mm' da una Date (input datetime-local) */
export function dateToInputDateTimeLocal(d: Date): string {
    return `${dateToInputDate(d)}T${dateToInputTime(d)}`
}

/** 'YYYY-MM-DD' casuale (range su giorno, l’ora viene ignorata) */
export function inputDateCasuale(range?: DateRangeInput): string {
    const d = dateCasuale(range)
    return dateToInputDate(d)
}

/** 'HH:mm' casuale (range opzionale su minuti/ore) */
export function inputTimeCasuale(opts?: { hourFrom?: number; hourTo?: number; minuteStep?: number }): string {
    const hourFrom = opts?.hourFrom ?? 0
    const hourTo = opts?.hourTo ?? 23
    const step = Math.max(1, opts?.minuteStep ?? 1)

    const h = randInt(hourFrom, hourTo)
    const mRaw = randInt(0, 59)
    const m = Math.floor(mRaw / step) * step

    return `${pad2(h)}:${pad2(m)}`
}

/** 'YYYY-MM-DDTHH:mm' casuale, con range data e opzioni ora */
export function inputDateTimeLocalCasuale(
    range?: DateRangeInput,
    optsTime?: { hourFrom?: number; hourTo?: number; minuteStep?: number }
): string {
    const d = dateCasuale(range)
    const t = inputTimeCasuale(optsTime)
    return `${dateToInputDate(d)}T${t}`
}

/* ------------------------------------------------------------------
 * Shortcut comodi (range relativi)
 * ------------------------------------------------------------------ */

/** Date casuale negli ultimi N giorni (default 30) */
export function dateCasualeUltimiGiorni(days = 30): Date {
    const to = new Date()
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    return dateCasuale({ from, to })
}

/** Date casuale nei prossimi N giorni (default 30) */
export function dateCasualeProssimiGiorni(days = 30): Date {
    const from = new Date()
    const to = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
    return dateCasuale({ from, to })
}

/** Timestamp casuale negli ultimi N giorni */
export function timestampCasualeUltimiGiorni(days = 30): Timestamp {
    return Timestamp.fromDate(dateCasualeUltimiGiorni(days))
}

/** Timestamp casuale nei prossimi N giorni */
export function timestampCasualeProssimiGiorni(days = 30): Timestamp {
    return Timestamp.fromDate(dateCasualeProssimiGiorni(days))
}

/* ------------------------------------------------------------------
 * Range helper (se vuoi comporli)
 * ------------------------------------------------------------------ */

/** Crea un range “giorno intero” (00:00 → 23:59:59.999) da una data */
export function rangeGiorno(d: Date | Timestamp | string | number): { from: Date; to: Date } {
    const dd = toDate(d) ?? new Date()
    const from = new Date(dd)
    from.setHours(0, 0, 0, 0)
    const to = new Date(dd)
    to.setHours(23, 59, 59, 999)
    return { from, to }
}

/** Normalizza e ritorna un range valido (con default) */
export function normalizeRange(range?: DateRangeInput): { from: Date; to: Date } {
    return resolveRange(range)
}
