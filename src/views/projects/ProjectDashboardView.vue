<script setup lang="ts">
import { _Auth, Btn, useChangeHeader, useHeaderExtra, useStoreWatch } from 'cic-kit';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppCard from '../../components/ui/AppCard.vue';
import { canWriteProjects } from '../../permissions';
import { projectMessageStore } from '../../stores/projectMessageStore';
import { projectStore } from '../../stores/projectStore';
import { projectTaskStore } from '../../stores/projectTaskStore';
import ProjectDashboardHeaderExtra from './ProjectDashboardHeaderExtra.vue';

useChangeHeader('Projects Dashboard', { name: 'home' });
useStoreWatch([
  { store: projectStore },
  { store: projectTaskStore },
  { store: projectMessageStore },
]);

const router = useRouter();
const search = ref('');
const canWriteProjectData = computed(() => canWriteProjects(_Auth?.user?.permissions));

const projects = computed(() => {
  const query = search.value.trim().toLowerCase();
  const items = [...projectStore.itemsActiveArray].sort((a, b) => a.name.localeCompare(b.name));
  if (!query) return items;

  return items.filter((item) => {
    return item.name.toLowerCase().includes(query) || String(item.description ?? '').toLowerCase().includes(query);
  });
});

function projectTaskCount(projectId: string) {
  return projectTaskStore.itemsActiveArray.filter((item) => item.projectId === projectId).length;
}

function projectErrorCount(projectId: string) {
  return projectMessageStore.itemsActiveArray.filter(
    (item) => item.projectId === projectId && item.typeMessage === 'error'
  ).length;
}

function projectMessageCount(projectId: string) {
  return projectMessageStore.itemsActiveArray.filter((item) => item.projectId === projectId).length;
}

function openCreateProject() {
  if (!canWriteProjectData.value) return;
  void router.push({ name: 'project-new' });
}

useHeaderExtra(ProjectDashboardHeaderExtra, {
  onCreate: openCreateProject,
  canCreate: () => canWriteProjectData.value,
});
</script>

<template>
  <div class="container pb-t overflow-auto h-100">
    <div class="search-bar-wrap">
      <input v-model="search" type="search" class="form-control" placeholder="Cerca progetto..." />
    </div>

    <div v-if="!projects.length" class="text-secondary">Nessun progetto trovato.</div>

    <div v-else class="row g-3">
      <div class="col-12 col-lg-6 col-xxl-4" v-for="project in projects" :key="project.id">
        <AppCard class="p-3 h-100 project-card d-flex flex-column">
          <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
            <div>
              <div class="fw-semibold text-truncate" :title="project.name">{{ project.name }}</div>
              <div class="small text-secondary" v-if="project.description">{{ project.description }}</div>
            </div>
            <div class="d-flex align-items-center gap-1">
              <RouterLink class="text-decoration-none" :to="{ name: 'project-board', params: { projectId: project.id } }">
                <Btn variant="ghost" color="primary" icon="view_kanban" tooltip="Board" />
              </RouterLink>
              <RouterLink class="text-decoration-none" :to="{ name: 'project-messages', params: { projectId: project.id } }">
                <Btn variant="ghost" color="dark" icon="chat" tooltip="Messaggi" />
              </RouterLink>
              <RouterLink
                v-if="canWriteProjectData"
                class="text-decoration-none"
                :to="{ name: 'project-edit', params: { projectId: project.id } }"
              >
                <Btn variant="ghost" color="secondary" icon="edit" tooltip="Modifica" />
              </RouterLink>
            </div>
          </div>

          <div class="d-flex flex-wrap gap-2 mt-auto">
            <span class="badge text-bg-primary d-inline-flex align-items-center gap-1">
              <span class="material-symbols-rounded icon-xs">checklist</span>
              {{ projectTaskCount(project.id) }}
            </span>
            <span class="badge text-bg-danger d-inline-flex align-items-center gap-1">
              <span class="material-symbols-rounded icon-xs">error</span>
              {{ projectErrorCount(project.id) }}
            </span>
            <span class="badge text-bg-secondary d-inline-flex align-items-center gap-1">
              <span class="material-symbols-rounded icon-xs">chat</span>
              {{ projectMessageCount(project.id) }}
            </span>
          </div>
        </AppCard>
      </div>
    </div>
  </div>
</template>

<style scoped>
.search-bar-wrap {
  position: sticky;
  top: 0;
  z-index: 2;
  background: var(--bs-body-bg, #fff);
  padding: 0.1rem 0 0.65rem 0;
}

.project-card {
  border-top: 4px solid rgba(48, 71, 94, 0.7);
}

.icon-xs {
  font-size: 0.95rem;
}
</style>
