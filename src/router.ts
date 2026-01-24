// router.ts
import { createRouter, createWebHistory } from 'vue-router'
import type { RouteLocationNormalizedGeneric, RouteRecordRaw } from 'vue-router'
import HomeView from './views/home/HomeAuthView.vue'
import UserView from './views/user/UserView.vue'
import LoginView from './views/user/LoginView.vue'
import { currentUserStore } from './stores/currentUserStore'
import { watch } from 'vue'
import ErrorView from './views/ErrorView.vue'
import RegisterView from './views/user/RegisterView.vue'
import ResetPasswordView from './views/user/ResetPasswordView.vue'
import TermsView from './views/policies/TermsView.vue'
import UserFormPersonalInfo from './views/user/usersettings/UserFormPersonalInfo.vue'
import SettingsView from './views/settings/SettingsView.vue'
import { store } from './stores/store'
import { setToolbarTab } from './components/toolbar/useChangeToolbar'
import type { UserPermission } from '@shared/enums/UserPermission'

declare module 'vue-router' {
  interface RouteMeta {
    onlyAuth?: boolean
    onlyNotAuth?: boolean
    permission?: UserPermission
  }
}

const routes: RouteRecordRaw[] = [
  // ===================================================================================================
  // public
  { path: '/', name: 'home', component: HomeView },
  { path: '/terms', name: 'terms', component: TermsView },


  // ===================================================================================================
  // onlyNotAuth
  { path: '/login', name: 'login', component: LoginView, meta: { onlyNotAuth: true } },
  { path: '/register', name: 'register', component: RegisterView, meta: { onlyNotAuth: true } },
  { path: '/reset-password', name: 'reset-password', component: ResetPasswordView, meta: { onlyNotAuth: true } },


  // ===================================================================================================
  // onlyAuth
  { path: '/user', name: 'user', component: UserView, meta: { onlyAuth: true } },
  { path: '/user/info', name: 'user-info', component: UserFormPersonalInfo, meta: { onlyAuth: true } },
  { path: '/settings', name: 'settings', component: SettingsView, meta: { onlyAuth: true } },


  // ===================================================================================================
  // --- Unauthorized
  { path: '/unauthorized', name: 'unauthorized', component: ErrorView, props: { kind: 'unauthorized' as const } },
  // --- 404 catch-all (deve stare in fondo)
  { path: '/:pathMatch(.*)*', name: 'not-found', component: ErrorView, props: (route) => ({ kind: '404' as const, attemptedPath: route.fullPath }) },
]

export const router = createRouter({
  history: createWebHistory(),
  routes
})

function doAccessCheck(to: RouteLocationNormalizedGeneric) {
  if (to.meta.onlyNotAuth && currentUserStore.isLoggedIn) {
    return { name: 'user' }
  }
  if (to.meta.onlyAuth && !currentUserStore.isLoggedIn) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.permission && !currentUserStore?.user?.hasPermission?.(to.meta.permission)) {
    return { name: 'unauthorized', query: { from: to.fullPath } }
  }
  return false
}

router.beforeEach((to) => {
  const name = store.TOOLBAR.getDefaultCurrentTab(to.name)
  setToolbarTab(name)
  if (!currentUserStore.isLoginChecked) {

    // aspetta che checkAuth parta
    currentUserStore.checkAuth()
    const stop = watch(
      () => currentUserStore.isLoginChecked,
      async (checked) => {
        if (checked) {
          stop();
          const routeLocation = doAccessCheck(to);
          router.push(routeLocation !== false ? routeLocation : to);
        }
      }
    )

    return false
  }
  const routeLocation = doAccessCheck(to);
  if (routeLocation !== false) {
    router.push(routeLocation);
  }
  return !routeLocation
})

// ---- HOOK POST-NAVIGAZIONE (qui lanci una funzione “ad ogni cambio rotta”)
// router.afterEach((to, from) => {
//   console.log(to, from);

// Qui metti qualsiasi side-effect che vuoi a ogni cambio pagina
// es: analytics, reset stati, aggiornare titolo, ecc.
// runOnEveryRouteChange(to, from)

// })

export default router

