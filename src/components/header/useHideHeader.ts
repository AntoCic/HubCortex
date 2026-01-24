// src/components/header/useHideHeader.ts
import { onMounted, onUnmounted } from 'vue'
import { store } from '../../stores/store'

export function useHideHeader() {
  onMounted(() => {
    store.HEADER.show = false
  })
  onUnmounted(() => {
    store.HEADER.show = true
  })
}
