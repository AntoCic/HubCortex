<script setup lang="ts">
import { _Auth, useChangeHeader } from 'cic-kit';
import { UserPermission } from '@shared/enums/UserPermission';
import { computed } from 'vue';
import type { RouteLocationRaw } from 'vue-router';
import { hasAppPermission } from '../../permissions';

useChangeHeader('Hub Apps', { name: 'home' });

type HomeApp = {
  id: string;
  title: string;
  to: RouteLocationRaw;
  icon: string;
  iconClass: string;
  permission?: string;
};

const apps: HomeApp[] = [
  {
    id: 'project-dashboard',
    title: 'Project Dashboard',
    to: { name: 'project-dashboard' },
    icon: 'dashboard_customize',
    iconClass: 'app-icon-project',
    permission: UserPermission.PROJECT_READ,
  },
  {
    id: 'notes',
    title: 'Notes',
    to: { name: 'notes' },
    icon: 'note_stack',
    iconClass: 'app-icon-note',
  },
  {
    id: 'cmd',
    title: 'Cmd',
    to: { name: 'cmd' },
    icon: 'terminal',
    iconClass: 'app-icon-cmd',
  },
  {
    id: 'tags',
    title: 'Tags',
    to: { name: 'tags' },
    icon: 'label',
    iconClass: 'app-icon-tag',
  },
  {
    id: 'ai-chat',
    title: 'Chat AI',
    to: { name: 'ai-chat' },
    icon: 'chat',
    iconClass: 'app-icon-chat',
    permission: UserPermission.AI,
  },
  {
    id: 'ai-image-chat',
    title: 'Image Chat',
    to: { name: 'ai-image-chat' },
    icon: 'imagesmode',
    iconClass: 'app-icon-image',
    permission: UserPermission.AI,
  },
];

const visibleApps = computed(() =>
  apps.filter((app) => {
    if (!app.permission) return true;
    return hasAppPermission(_Auth?.user?.permissions, app.permission);
  })
);
</script>

<template>
  <div class="container pb-t overflow-auto h-100 pt-4">
    <div class="apps-grid">
      <RouterLink v-for="app in visibleApps" :key="app.id" :to="app.to" class="app-shortcut text-decoration-none">
        <div class="app-tile">
          <div class="app-icon" :class="app.iconClass">
            <span class="material-symbols-rounded app-icon-symbol">{{ app.icon }}</span>
          </div>
          <div class="app-title">{{ app.title }}</div>
        </div>
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>

.apps-grid {
  display: grid;
  gap: 1.2rem 0.7rem;
  grid-template-columns: repeat(auto-fill, minmax(84px, 1fr));
}

.app-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.45rem;
}

.app-icon {
  width: 62px;
  height: 62px;
  border-radius: 18px;
  display: grid;
  place-items: center;
  color: #fff;
  box-shadow: 0 8px 18px rgba(35, 46, 58, 0.16);
}

.app-icon-symbol {
  font-size: 1.9rem;
  line-height: 1;
  font-variation-settings: 'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24;
}

.app-title {
  color: #222831;
  font-size: 0.8rem;
  font-weight: 600;
  text-align: center;
  line-height: 1.2;
}

.app-shortcut {
  color: inherit;
}

.app-shortcut:focus-visible {
  outline: 2px solid #1f5eff;
  outline-offset: 4px;
  border-radius: 6px;
}

.app-icon-project {
  background: linear-gradient(135deg, #30475e 0%, #1f8a70 100%);
}

.app-icon-chat {
  background: linear-gradient(135deg, #1f5eff 0%, #2d9cff 100%);
}

.app-icon-image {
  background: linear-gradient(135deg, #ff7a45 0%, #f05454 100%);
}

.app-icon-note {
  background: linear-gradient(135deg, #efb036 0%, #f05454 100%);
}

.app-icon-cmd {
  background: linear-gradient(135deg, #30475e 0%, #222831 100%);
}

.app-icon-tag {
  background: linear-gradient(135deg, #1f8a70 0%, #2f5233 100%);
}
</style>
