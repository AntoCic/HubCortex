// src/components/header/useHideHeader.ts
import { onMounted, onUnmounted } from 'vue'
import { store, type ToolbarState, type ToolbarTabName } from '../../stores/store'

export function useChangeToolbar(type: ToolbarState['type'], currentTab: ToolbarTabName = '') {
  onMounted(() => {
    store.TOOLBAR.type = type
    store.TOOLBAR.prevTab = store.TOOLBAR.currentTab
    store.TOOLBAR.currentTab = currentTab
  })
  onUnmounted(() => {
    store.TOOLBAR.type = 'main'
    store.TOOLBAR.prevTab = ''
    store.TOOLBAR.currentTab = ''
  })
}

export function setToolbarTab(currentTab: ToolbarTabName = '') {
  store.TOOLBAR.prevTab = store.TOOLBAR.currentTab
  store.TOOLBAR.currentTab = currentTab
}
