export function clone<U>(o: U): U {
  const sc = (globalThis as any).structuredClone
  if (typeof sc === 'function') {
    try {
      return sc(o)
    } catch {
      return deepClone(o)
    }
  }
  return deepClone(o)
}

function deepClone<T>(obj: T, seen = new WeakMap<any, any>()): T {
  // primitivi o funzioni
  if (obj === null || typeof obj !== 'object') return obj
  if (seen.has(obj as any)) return seen.get(obj as any)

  // Date
  if (obj instanceof Date) return new Date(obj.getTime()) as any

  // Map
  if (obj instanceof Map) {
    const m = new Map()
    seen.set(obj as any, m)
    obj.forEach((v, k) => m.set(deepClone(k, seen), deepClone(v, seen)))
    return m as any
  }

  // Set
  if (obj instanceof Set) {
    const s = new Set()
    seen.set(obj as any, s)
    obj.forEach((v) => s.add(deepClone(v, seen)))
    return s as any
  }

  // Array
  if (Array.isArray(obj)) {
    const arr: any[] = new Array(obj.length)
    seen.set(obj as any, arr)
    for (let i = 0; i < obj.length; i++) arr[i] = deepClone((obj as any)[i], seen)
    return arr as any
  }

  // Oggetti plain: preserva TUTTE le chiavi (anche undefined)
  const out: any = {}
  seen.set(obj as any, out)
  for (const key of Object.keys(obj as any)) {
    out[key] = deepClone((obj as any)[key], seen)
  }
  // (opzionale) copia anche symbol keys
  for (const sym of Object.getOwnPropertySymbols(obj as any)) {
    out[sym] = deepClone((obj as any)[sym], seen)
  }
  return out
}
