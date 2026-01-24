/**
 * Genera un numero intero casuale tra min e max (inclusi).
 * Default: 0–100
 */
export function randomInt(
  min: number = 0,
  max: number = 100
): number {
  const a = Math.ceil(min)
  const b = Math.floor(max)

  if (a > b) {
    throw new Error(`randomInt: min (${min}) non può essere > max (${max})`)
  }

  return Math.floor(Math.random() * (b - a + 1)) + a
}
