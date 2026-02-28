import {
  ErrorView as DefaultErrorView,
  LoginView,
  RegisterView,
  ResetPasswordView,
  UserView,
  _Auth,
  initRouter,
  setToolbarTab,
} from 'cic-kit';
import { createWebHistory, type RouteRecordRaw } from 'vue-router';
import AppConfigView from './views/admin/AppConfigView.vue';
import AgentPromptsView from './views/admin/AgentPromptsView.vue';
import PublicUsersView from './views/admin/PublicUsersView.vue';
import HomeAuthView from './views/home/HomeAuthView.vue';
import HomeView from './views/home/HomeView.vue';
import ProjectsView from './views/projects/ProjectsView.vue';

declare module 'vue-router' {
  interface RouteMeta {
    onlyAuth?: boolean;
    onlyNotAuth?: boolean;
    permission?: string;
  }
}

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: HomeView },

  { path: '/login', name: 'login', component: LoginView, meta: { onlyNotAuth: true } },
  { path: '/register', name: 'register', component: RegisterView, meta: { onlyNotAuth: true } },
  { path: '/reset-password', name: 'reset-password', component: ResetPasswordView, meta: { onlyNotAuth: true } },

  { path: '/home-auth', name: 'home-auth', component: HomeAuthView, meta: { onlyAuth: true } },
  { path: '/projects', name: 'projects', component: ProjectsView, meta: { onlyAuth: true } },
  { path: '/user', name: 'user', component: UserView, meta: { onlyAuth: true } },

  {
    path: '/admin/agent-prompts',
    name: 'agent-prompts',
    component: AgentPromptsView,
    meta: { onlyAuth: true, permission: 'AI' },
  },
  {
    path: '/admin/app-config',
    name: 'app-config',
    component: AppConfigView,
    meta: { onlyAuth: true, permission: 'SUPERADMIN' },
  },
  {
    path: '/admin/public-users',
    name: 'public-users',
    component: PublicUsersView,
    meta: { onlyAuth: true, permission: 'ADMIN' },
  },

  {
    path: '/unauthorized',
    name: 'unauthorized',
    component: DefaultErrorView,
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: DefaultErrorView,
  },
];

export const router = initRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  setToolbarTab(String(to.name ?? 'home'));

  if (_Auth?.isOnLoginProcess) {
    return false;
  }

  if (to.meta.onlyNotAuth && _Auth?.isLoggedIn) {
    return { name: 'home-auth' };
  }

  if (to.meta.onlyAuth && !_Auth?.isLoggedIn) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }

  if (to.meta.permission && !_Auth?.user?.hasPermission?.(to.meta.permission)) {
    return { name: 'unauthorized', query: { from: to.fullPath } };
  }

  return true;
});

export default router;
