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
import GenericChatView from './views/ai/GenericChatView.vue';
import ImageChatView from './views/ai/ImageChatView.vue';
import CmdListView from './views/cmd/CmdListView.vue';
import HomeView from './views/home/HomeView.vue';
import NoteEditorView from './views/note/NoteEditorView.vue';
import NotesListView from './views/note/NotesListView.vue';
import ProjectBoardView from './views/projects/ProjectBoardView.vue';
import ProjectDashboardView from './views/projects/ProjectDashboardView.vue';
import ProjectFormView from './views/projects/ProjectFormView.vue';
import ProjectMessagesView from './views/projects/ProjectMessagesView.vue';
import TagsListView from './views/tag/TagsListView.vue';

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

  { path: '/projects/dashboard', name: 'project-dashboard', component: ProjectDashboardView, meta: { onlyAuth: true } },
  { path: '/projects/new', name: 'project-new', component: ProjectFormView, meta: { onlyAuth: true } },
  { path: '/projects/:projectId/edit', name: 'project-edit', component: ProjectFormView, meta: { onlyAuth: true } },
  { path: '/projects/:projectId/board', name: 'project-board', component: ProjectBoardView, meta: { onlyAuth: true } },
  { path: '/projects/:projectId/messages', name: 'project-messages', component: ProjectMessagesView, meta: { onlyAuth: true } },
  { path: '/notes', name: 'notes', component: NotesListView, meta: { onlyAuth: true } },
  { path: '/notes/new', name: 'note-new', component: NoteEditorView, meta: { onlyAuth: true } },
  { path: '/notes/:noteId', name: 'note-edit', component: NoteEditorView, meta: { onlyAuth: true } },
  { path: '/cmd', name: 'cmd', component: CmdListView, meta: { onlyAuth: true } },
  { path: '/tags', name: 'tags', component: TagsListView, meta: { onlyAuth: true } },
  { path: '/projects', name: 'projects', redirect: { name: 'project-dashboard' }, meta: { onlyAuth: true } },
  { path: '/ai/chat', name: 'ai-chat', component: GenericChatView, meta: { onlyAuth: true, permission: 'AI' } },
  {
    path: '/ai/image-chat',
    name: 'ai-image-chat',
    component: ImageChatView,
    meta: { onlyAuth: true, permission: 'AI' },
  },
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
    return { name: 'home' };
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
