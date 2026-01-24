// src/components/header/useHeaderExtra.ts
import { onMounted, onUnmounted, type Component } from 'vue'
import { store } from '../../stores/store'

export function useHeaderExtra(component: Component | null = null, props: Record<string, unknown> = {}) {
  onMounted(() => {
    store.HEADER.extra = component
    store.HEADER.extraProps = props
  })
  onUnmounted(() => {
    // pulizia automatica quando si lascia la vista
    store.HEADER.extra = null
    store.HEADER.extraProps = {}
  })
}
