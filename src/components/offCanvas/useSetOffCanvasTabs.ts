import { onMounted, onUnmounted } from 'vue'
import { store, type OffcanvasTab } from '../../stores/store'

export function useSetOffCanvasTabs(tabs: OffcanvasTab[],) {
  onMounted(() => {
    store.OFFCANVAS.tabs = tabs
  })
  onUnmounted(() => {
    store.OFFCANVAS.tabs = undefined
  })
}
