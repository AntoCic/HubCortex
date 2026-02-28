<script setup lang="ts">
import { useChangeHeader } from 'cic-kit';
import type { RouteLocationRaw } from 'vue-router';
import AppCard from '../../components/ui/AppCard.vue';

useChangeHeader('Hub Apps', { name: 'home' });

type HomeApp = {
  id: string;
  title: string;
  description: string;
  to: RouteLocationRaw;
  icon: string;
  iconClass: string;
};

const apps: HomeApp[] = [
  {
    id: 'project-dashboard',
    title: 'Project Dashboard',
    description: 'Panoramica rapida su progetti, task ed errori.',
    to: { name: 'project-dashboard' },
    icon: 'PD',
    iconClass: 'app-icon-project',
  },
  {
    id: 'ai-chat',
    title: 'Chat AI',
    description: 'Chat testuale con i modelli AI.',
    to: { name: 'ai-chat' },
    icon: 'AI',
    iconClass: 'app-icon-chat',
  },
  {
    id: 'ai-image-chat',
    title: 'Image Chat',
    description: 'Chat AI dedicata alle immagini.',
    to: { name: 'ai-image-chat' },
    icon: 'IMG',
    iconClass: 'app-icon-image',
  },
];
</script>

<template>
  <div class="container pb-t overflow-auto h-100">
    <div class="apps-grid">
      <RouterLink v-for="app in apps" :key="app.id" :to="app.to" class="app-link text-decoration-none">
        <AppCard class="app-tile p-3">
          <div class="app-icon" :class="app.iconClass">{{ app.icon }}</div>
          <div class="fw-semibold text-dark">{{ app.title }}</div>
          <div class="small text-secondary">{{ app.description }}</div>
        </AppCard>
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.apps-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
}

.app-link {
  color: inherit;
}

.app-tile {
  min-height: 180px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.8rem;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.app-link:hover .app-tile {
  transform: translateY(-4px);
  box-shadow: 0 16px 30px rgba(26, 39, 52, 0.16);
}

.app-icon {
  width: 54px;
  height: 54px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.04em;
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
</style>
