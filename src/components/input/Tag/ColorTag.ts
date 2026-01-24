
export type ColorTag = {
  label: string
  color: string
}

export const toColorTag = (it: unknown): ColorTag | null => {
  if (it && typeof it === 'object' && 'label' in it && 'color' in it) {
    const label = String((it as any).label ?? '').trim()
    const color = String((it as any).color ?? '').trim()
    if (!label) return null
    return { label, color: color || '#1985a1' } as ColorTag
  }
  if (typeof it === 'string') {
    const label = it.trim()
    if (!label) return null
    return { label, color: '#1985a1' } as ColorTag
  }
  return null
}

export const toColorTagArray = (x: unknown): ColorTag[] => {
  if (!Array.isArray(x)) return []
  return x.map(it => toColorTag(it))
    .filter(Boolean) as ColorTag[]
}