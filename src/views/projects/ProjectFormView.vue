<script setup lang="ts">
import { _Auth, toast, useChangeHeader, useStoreWatch } from 'cic-kit';
import { computed, reactive, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppCard from '../../components/ui/AppCard.vue';
import {
  PROJECT_API_KEY_LENGTH,
  generateProjectApiKey,
  normalizeProjectMessageTypes,
  type Project,
} from '../../models/Project';
import { projectStore } from '../../stores/projectStore';

useStoreWatch([{ store: projectStore }]);
useChangeHeader('Progetto', { name: 'project-dashboard' });

const route = useRoute();
const router = useRouter();
const routeProjectId = computed(() => String(route.params.projectId ?? '').trim());
const isEdit = computed(() => Boolean(routeProjectId.value));

const form = reactive({
  name: '',
  description: '',
  logoUrl: '',
  repoUrl: '',
  hostingUrl: '',
  typeMessageText: '',
});

const projectDoc = computed<Project | undefined>(() => {
  if (!routeProjectId.value) return undefined;
  return projectStore.items?.[routeProjectId.value];
});

watch(
  [routeProjectId, projectDoc],
  async ([projectId, project]) => {
    if (!projectId) {
      resetForm();
      return;
    }

    const doc = project ?? (await projectStore.getOne(projectId));
    if (!doc) {
      toast.error('Progetto non trovato.');
      await router.replace({ name: 'project-dashboard' });
      return;
    }

    fillFromProject(doc);
  },
  { immediate: true },
);

function fillFromProject(project: Project) {
  form.name = project.name;
  form.description = project.description ?? '';
  form.logoUrl = project.logoUrl ?? '';
  form.repoUrl = project.repoUrl ?? '';
  form.hostingUrl = project.hostingUrl ?? '';
  form.typeMessageText = normalizeProjectMessageTypes(project.typeMessage).join(', ');
}

function resetForm() {
  form.name = '';
  form.description = '';
  form.logoUrl = '';
  form.repoUrl = '';
  form.hostingUrl = '';
  form.typeMessageText = '';
}

function getUpdater() {
  return String(_Auth?.uid ?? 'system');
}

function parseTypeMessageInput(value: string) {
  const raw = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return normalizeProjectMessageTypes(raw);
}

async function saveProject() {
  const name = form.name.trim();
  if (!name) {
    toast.warning('Inserisci il nome progetto.');
    return;
  }

  const payload = {
    name,
    description: form.description.trim() || undefined,
    logoUrl: form.logoUrl.trim() || undefined,
    repoUrl: form.repoUrl.trim() || undefined,
    hostingUrl: form.hostingUrl.trim() || undefined,
    typeMessage: parseTypeMessageInput(form.typeMessageText),
    updateBy: getUpdater(),
  };

  if (projectDoc.value) {
    await projectDoc.value.update(payload);
    toast.success('Progetto aggiornato.');
    await router.push({ name: 'project-dashboard' });
    return;
  }

  await projectStore.add({
    ...payload,
    apiKey: generateProjectApiKey(PROJECT_API_KEY_LENGTH),
    createdBy: getUpdater(),
  });

  toast.success('Progetto creato.');
  await router.push({ name: 'project-dashboard' });
}

async function regenerateApiKey() {
  if (!projectDoc.value) return;

  const confirmed = window.confirm('Rigenerare API key progetto? La precedente non funzionera piu.');
  if (!confirmed) return;

  await projectDoc.value.update({
    apiKey: generateProjectApiKey(PROJECT_API_KEY_LENGTH),
    updateBy: getUpdater(),
  });

  toast.success('API key rigenerata.');
}
</script>

<template>
  <div class="container pb-t overflow-auto h-100">
    <div class="row justify-content-center">
      <div class="col-12 col-xxl-10">
        <AppCard class="p-4">
          <div class="d-flex justify-content-between align-items-start mb-3">
            <div>
              <h1 class="h4 mb-1">{{ isEdit ? 'Modifica progetto' : 'Nuovo progetto' }}</h1>
              <div class="text-secondary small">Gestione dati progetto e configurazione messaggi.</div>
            </div>
            <RouterLink :to="{ name: 'project-dashboard' }" class="btn btn-outline-secondary">Torna alla dashboard</RouterLink>
          </div>

          <div class="row g-3">
            <div class="col-12 col-lg-6">
              <label class="form-label small">Nome progetto</label>
              <input v-model="form.name" class="form-control" placeholder="HubCortex API" />
            </div>
            <div class="col-12 col-lg-6">
              <label class="form-label small">Logo URL</label>
              <input v-model="form.logoUrl" class="form-control" placeholder="https://..." />
            </div>
            <div class="col-12">
              <label class="form-label small">Descrizione</label>
              <textarea v-model="form.description" class="form-control" rows="3" placeholder="Descrizione progetto" />
            </div>
            <div class="col-12 col-lg-6">
              <label class="form-label small">Repository URL (GitHub)</label>
              <input v-model="form.repoUrl" class="form-control" placeholder="https://github.com/org/repo" />
            </div>
            <div class="col-12 col-lg-6">
              <label class="form-label small">Hosting URL</label>
              <input v-model="form.hostingUrl" class="form-control" placeholder="https://..." />
            </div>
            <div class="col-12">
              <label class="form-label small">Tipi messaggio (comma separated)</label>
              <input
                v-model="form.typeMessageText"
                class="form-control"
                placeholder="error, warning, info, deployment, billing"
              />
            </div>
          </div>

          <div class="border rounded p-3 mt-3" v-if="projectDoc">
            <div class="small text-secondary mb-1">API key attuale</div>
            <div class="input-group">
              <input :value="projectDoc.apiKey" class="form-control font-monospace" readonly />
              <button class="btn btn-outline-danger" @click="regenerateApiKey">Rigenera</button>
            </div>
          </div>

          <div class="d-flex gap-2 mt-4">
            <button class="btn btn-primary" @click="saveProject">{{ isEdit ? 'Salva modifiche' : 'Crea progetto' }}</button>
            <RouterLink :to="{ name: 'project-dashboard' }" class="btn btn-outline-secondary">Annulla</RouterLink>
          </div>
        </AppCard>
      </div>
    </div>
  </div>
</template>
