<script setup lang="ts">
import { computed, ref } from 'vue';
import { useStoreWatch, useChangeHeader } from 'cic-kit';
import AppCard from '../../components/ui/AppCard.vue';
import { projectMessageStore } from '../../stores/projectMessageStore';
import { projectStore } from '../../stores/projectStore';
import { projectTaskStore } from '../../stores/projectTaskStore';

useChangeHeader('Projects Dashboard', { name: 'home' });

useStoreWatch([
  { store: projectStore },
  { store: projectTaskStore },
  { store: projectMessageStore },
]);

const search = ref('');

const projects = computed(() => {
  const query = search.value.trim().toLowerCase();
  const items = [...projectStore.itemsActiveArray].sort((a, b) => a.name.localeCompare(b.name));

  if (!query) return items;

  return items.filter((item) => {
    return (
      item.name.toLowerCase().includes(query) ||
      String(item.description ?? '').toLowerCase().includes(query)
    );
  });
});

function projectTaskCount(projectId: string) {
  return projectTaskStore.itemsActiveArray.filter((item) => item.projectId === projectId).length;
}

function projectErrorCount(projectId: string) {
  return projectMessageStore.itemsActiveArray.filter(
    (item) => item.projectId === projectId && item.typeMessage === 'error',
  ).length;
}

function projectMessageCount(projectId: string) {
  return projectMessageStore.itemsActiveArray.filter((item) => item.projectId === projectId).length;
}
</script>

<template>
  <div class="container pb-t overflow-auto h-100">
    <AppCard class="p-3 p-md-4 mb-3">
      <div class="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-3">
        <div>
          <h1 class="h4 mb-1">Progetti</h1>
          <div class="small text-secondary">Seleziona un progetto per aprire board, messaggi, note e cmd utils.</div>
        </div>
        <RouterLink :to="{ name: 'project-new' }" class="btn btn-primary">+ Nuovo progetto</RouterLink>
      </div>

      <div class="row g-2 align-items-center">
        <div class="col-12 col-md-7 col-lg-5">
          <input v-model="search" type="search" class="form-control" placeholder="Cerca progetto" />
        </div>
      </div>
    </AppCard>

    <div v-if="!projects.length" class="text-secondary">Nessun progetto trovato.</div>

    <div v-else class="d-flex flex-column gap-3">
      <AppCard v-for="project in projects" :key="project.id" class="p-3">
        <div class="d-flex flex-wrap gap-3 justify-content-between align-items-start">
          <div>
            <h2 class="h6 mb-1">{{ project.name }}</h2>
            <div class="small text-secondary mb-2" v-if="project.description">{{ project.description }}</div>
            <div class="d-flex flex-wrap gap-2">
              <span class="badge text-bg-primary">task {{ projectTaskCount(project.id) }}</span>
              <span class="badge text-bg-danger">error {{ projectErrorCount(project.id) }}</span>
              <span class="badge text-bg-secondary">msg {{ projectMessageCount(project.id) }}</span>
            </div>
          </div>

          <div class="d-flex flex-wrap gap-2">
            <RouterLink class="btn btn-sm btn-outline-primary" :to="{ name: 'project-board', params: { projectId: project.id } }">
              Board
            </RouterLink>
            <RouterLink class="btn btn-sm btn-outline-dark" :to="{ name: 'project-messages', params: { projectId: project.id } }">
              Messaggi
            </RouterLink>
            <RouterLink class="btn btn-sm btn-outline-success" :to="{ name: 'project-notes', params: { projectId: project.id } }">
              Note
            </RouterLink>
            <RouterLink class="btn btn-sm btn-outline-warning" :to="{ name: 'project-cmd-utils', params: { projectId: project.id } }">
              Cmd Utils
            </RouterLink>
            <RouterLink class="btn btn-sm btn-outline-secondary" :to="{ name: 'project-edit', params: { projectId: project.id } }">
              Modifica
            </RouterLink>
          </div>
        </div>
      </AppCard>
    </div>
  </div>
</template>
