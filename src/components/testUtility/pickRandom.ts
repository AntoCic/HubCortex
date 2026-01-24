/**
 * Ritorna un valore casuale da un array.
 * È possibile escludere uno specifico valore.
 */
export function pickRandom<T>(
  items: readonly T[],
  exclude?: T
): T | undefined {
  if (!items.length) return undefined

  const filtered = exclude !== undefined
    ? items.filter(v => v !== exclude)
    : items

  if (!filtered.length) return undefined

  const i = Math.floor(Math.random() * filtered.length)
  return filtered[i]
}
