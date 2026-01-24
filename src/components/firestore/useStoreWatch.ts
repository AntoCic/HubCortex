import { onBeforeMount, onBeforeUnmount, watch } from 'vue'
import type { AnyFirestoreStoreReactive, GetProps } from './FirestoreStore'
import { currentUserStore } from '../../stores/currentUserStore'

type StoreWatchItem = {
  store: AnyFirestoreStoreReactive
  getOpts?: GetProps
  getAuthOpts?: GetProps
  checkLogin?: boolean
}

export function useStoreWatch(
  stores: readonly StoreWatchItem[],
  defaultCheckLogin: boolean = true
) {
  const needLogin = (s: StoreWatchItem) =>
    s.checkLogin !== undefined ? s.checkLogin : defaultCheckLogin

  let stopLoginWatch: (() => void) | null = null

  onBeforeMount(() => {
    stopLoginWatch = watch(
      () => currentUserStore.isLoggedIn,
      (logged) => {
        for (const s of stores) {
          if (logged) {
            s.store.start(s.getAuthOpts ?? s.getOpts)
          } else {
            if (needLogin(s)) {
              s.store.stop();
            } else {
              s.store.start(s.getOpts)
            }
          }
        }
      },
      { immediate: true }
    )

  })

  onBeforeUnmount(() => {
    stopLoginWatch?.()
    stopLoginWatch = null
    for (const s of stores) {
      s.store.stop()
    }
  })
}
