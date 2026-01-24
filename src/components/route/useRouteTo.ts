// src/composables/useRouteTo.ts
import { useRouter } from 'vue-router'

export function useRouteTo() {
  const router = useRouter()

  function routeTo(name: string, params?: Record<string, any>, query?: Record<string, any>) {
    return router.push({ name, params, query })
  }

  return { routeTo }
}
