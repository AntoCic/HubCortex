// src/components/header/useHideHeader.ts
import { onMounted, onUnmounted } from 'vue'
import { store } from '../../stores/store'
import type { RouteLocationRaw } from 'vue-router'

export function useChangeHeader(title: string, backTo?: RouteLocationRaw, logoUrl?: string) {
  onMounted(() => {
    store.HEADER.title = title
    store.HEADER.backTo = backTo
    if (logoUrl) {
      store.HEADER.logoUrl = logoUrl
    }
  })
  onUnmounted(() => {
    store.HEADER.title = store.HEADER.defaultTitle
    store.HEADER.backTo = undefined
    if (store.HEADER.logoUrl !== store.HEADER.defaultLogoUrl) {
      store.HEADER.logoUrl = store.HEADER.defaultLogoUrl
    }
    if (store.HEADER.logoShape !== 'square') {
      store.HEADER.logoShape = 'square'
    }
    if (store.HEADER.userBtn !== true) {
      store.HEADER.userBtn = true
    }
  })
}
