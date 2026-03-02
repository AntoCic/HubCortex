<script setup lang="ts">
import { _Auth, toast, useChangeHeader, useStoreWatch } from 'cic-kit';
import { computed, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { callListGitHubRepositories, type GitHubRepositoryItem } from '../../call/callGitHubRepositories';
import { hub } from '../../call/hub';
import AppCard from '../../components/ui/AppCard.vue';
import {
  PROJECT_API_KEY_LENGTH,
  generateProjectApiKey,
  normalizeProjectMessageTypes,
  type Project,
} from '../../models/Project';
import { canManageGitHub } from '../../permissions';
import { appConfigStore } from '../../stores/appConfigStore';
import { projectStore } from '../../stores/projectStore';

type GitHubRepoOption = {
  id: number;
  fullName: string;
  url: string;
};

useStoreWatch([{ store: projectStore }, { store: appConfigStore, checkLogin: false }]);
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
const selectedRepoUrl = ref('');
const githubRepoOptions = ref<GitHubRepoOption[]>([]);
const isLoadingRepos = ref(false);
const repoLoadError = ref('');
const githubOrg = computed(() => appConfigStore.getConfigData().githubOrg.trim());
const canManageProjectGitHub = computed(() => canManageGitHub(_Auth?.user?.permissions));
const isLoggedIn = computed(() => Boolean(_Auth?.isLoggedIn));

const projectDoc = computed<Project | undefined>(() => {
  if (!routeProjectId.value) return undefined;
  return projectStore.items?.[routeProjectId.value];
});
const projectApiKey = computed(() => String(projectDoc.value?.apiKey ?? '').trim());
const repoSelectPlaceholder = computed(() => {
  if (!canManageProjectGitHub.value) {
    return 'Permesso GITHUB_MANAGE richiesto'
  }

  if (isLoadingRepos.value) {
    return 'Caricamento repository...'
  }

  if (githubRepoOptions.value.length) {
    return 'Seleziona repository da GitHub'
  }

  return 'Nessun repository disponibile da selezione'
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

watch(
  [githubOrg, canManageProjectGitHub, isLoggedIn],
  () => {
    void loadGitHubRepos();
  },
  { immediate: true }
);

watch(
  () => form.repoUrl,
  (value) => {
    const normalized = String(value ?? '').trim();
    if (!normalized) {
      selectedRepoUrl.value = '';
      return;
    }

    const match = githubRepoOptions.value.find((item) => item.url === normalized);
    selectedRepoUrl.value = match?.url ?? '';
  },
  { immediate: true }
);

watch(selectedRepoUrl, (value) => {
  const normalized = String(value ?? '').trim();
  if (!normalized) return;
  form.repoUrl = normalized;
});

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

function normalizeGitHubOrg(value: unknown) {
  const normalized = String(value ?? '').trim().replace(/^@+/, '');
  if (!normalized || normalized.toLowerCase() === 'your-org') {
    return '';
  }
  return normalized;
}

function mapGitHubRepoOptions(items: GitHubRepositoryItem[]) {
  return items
    .map((item) => {
      const id = Number(item.id ?? 0);
      const fullName = String(item.fullName ?? '').trim();
      const url = String(item.url ?? '').trim();
      if (!id || !fullName || !url) return undefined;
      return { id, fullName, url };
    })
    .filter((item): item is GitHubRepoOption => Boolean(item))
    .sort((a, b) => a.fullName.localeCompare(b.fullName));
}

function notifyHub(type: 'info' | 'warning' | 'error', message: string) {
  const apiKey = projectApiKey.value;
  if (!apiKey) return;

  void hub[type]({
    apiKey,
    message,
    sendPush: false,
  }).catch(() => undefined);
}

function isTransientCallableError(error: unknown) {
  const message = readErrorMessage(error).toLowerCase();
  return message.includes('internal') || message.includes('unavailable') || message.includes('network');
}

async function delay(ms: number) {
  await new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function callRepoListWithRetry(input?: { org?: string }) {
  const maxAttempts = 2;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await callListGitHubRepositories(input ?? {});
    } catch (error) {
      lastError = error;
      if (attempt >= maxAttempts || !isTransientCallableError(error)) {
        throw error;
      }
      await delay(400 * attempt);
    }
  }

  throw lastError ?? new Error('Errore non gestito.');
}

async function loadReposFromOrg(org: string) {
  const response = await callRepoListWithRetry({ org });
  return mapGitHubRepoOptions(response.repositories);
}

async function loadReposFromUser() {
  const response = await callRepoListWithRetry();
  return mapGitHubRepoOptions(response.repositories);
}

async function loadGitHubRepos() {
  githubRepoOptions.value = [];
  repoLoadError.value = '';

  if (!canManageProjectGitHub.value) {
    repoLoadError.value = 'Permesso GITHUB_MANAGE richiesto per caricare repository.';
    return;
  }

  if (!isLoggedIn.value) {
    repoLoadError.value = 'Sessione non pronta. Riprova tra qualche secondo.';
    return;
  }

  const org = normalizeGitHubOrg(githubOrg.value);

  isLoadingRepos.value = true;

  try {
    if (!org) {
      githubRepoOptions.value = await loadReposFromUser();
      return;
    }

    try {
      githubRepoOptions.value = await loadReposFromOrg(org);
      if (githubRepoOptions.value.length) {
        return;
      }
    } catch (error) {
      const orgErrorMessage = readErrorMessage(error);
      githubRepoOptions.value = await loadReposFromUser();
      if (githubRepoOptions.value.length) {
        toast.warning(`Org "${org}" non raggiungibile. Mostro i repository utente.`);
        notifyHub(
          'warning',
          `⚠️ Org GitHub "${org}" non raggiungibile durante il caricamento repository. Fallback su repository utente. Dettaglio: ${orgErrorMessage}`,
        );
        return;
      }
      throw error;
    }

    githubRepoOptions.value = await loadReposFromUser();
    if (githubRepoOptions.value.length) {
      toast.warning(`Nessun repository trovato per org "${org}". Mostro i repository utente.`);
      notifyHub(
        'warning',
        `⚠️ Nessun repository disponibile per org "${org}". Fallback su repository utente disponibile.`,
      );
      return;
    }

    repoLoadError.value = `Nessun repository disponibile per org "${org}" e utente autenticato.`;
    notifyHub(
      'warning',
      `⚠️ Nessun repository disponibile sia per org "${org}" sia per utente autenticato.`,
    );
  } catch (error) {
    repoLoadError.value = readRepoLoadErrorMessage(error);
    notifyHub('error', `❌ Caricamento repository GitHub fallito: ${repoLoadError.value}`);
  } finally {
    isLoadingRepos.value = false;
  }
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

function readErrorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message?: unknown }).message ?? 'Errore non gestito.');
  }
  return 'Errore non gestito.';
}

function readRepoLoadErrorMessage(error: unknown) {
  const raw = readErrorMessage(error);
  const normalized = raw.toLowerCase();

  if (normalized === 'internal' || normalized.includes('cors')) {
    return 'Errore temporaneo di connessione alla callable GitHub. Aggiorna la pagina (Ctrl+F5) e riprova.';
  }

  return raw;
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
              <select
                v-model="selectedRepoUrl"
                class="form-select mb-2"
                :disabled="isLoadingRepos || !canManageProjectGitHub || !githubRepoOptions.length"
              >
                <option value="">
                  {{ repoSelectPlaceholder }}
                </option>
                <option v-for="repo in githubRepoOptions" :key="repo.id" :value="repo.url">{{ repo.fullName }}</option>
              </select>
              <input v-model="form.repoUrl" class="form-control" placeholder="https://github.com/org/repo" />
              <div class="small text-secondary mt-1">La select compila solo il campo. Puoi sempre inserirlo/modificarlo a mano.</div>
              <div v-if="repoLoadError" class="small text-danger mt-1">{{ repoLoadError }}</div>
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
                placeholder="error, warning, info, deploy, billing"
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
