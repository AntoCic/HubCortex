<script setup lang="ts">
import { _Auth, ContainerSideTabs, toast, useChangeHeader, useStoreWatch, type SideTabs } from 'cic-kit';
import { computed, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppCard from '../../components/ui/AppCard.vue';
import { callPublishProjectMessage } from '../../call/callPublishProjectMessage';
import { normalizeMessageType, normalizeProjectMessageTypes } from '../../models/Project';
import { projectMessageStore } from '../../stores/projectMessageStore';
import { projectNotificationPreferenceStore } from '../../stores/projectNotificationPreferenceStore';
import { projectStore } from '../../stores/projectStore';
import { projectTaskStore } from '../../stores/projectTaskStore';

useChangeHeader('Messaggi Progetto', { name: 'project-dashboard' });
useStoreWatch([{ store: projectStore }]);

const route = useRoute();
const router = useRouter();
const projectId = computed(() => String(route.params.projectId ?? '').trim());
const activeType = ref('');
const isPublishing = ref(false);

const form = reactive({
  taskId: '',
  title: '',
  message: '',
  sendPush: true,
});

const project = computed(() => {
  if (!projectId.value) return undefined;
  return projectStore.items?.[projectId.value];
});

const messageTypes = computed(() => normalizeProjectMessageTypes(project.value?.typeMessage));
const projectTasks = computed(() => (projectId.value ? projectTaskStore.forProject(projectId.value) : []));
const allProjectMessages = computed(() => (projectId.value ? projectMessageStore.forProject(projectId.value) : []));
const filteredMessages = computed(() =>
  allProjectMessages.value.filter((item) => item.typeMessage === normalizeMessageType(activeType.value)),
);

const sideTabs = computed<SideTabs>(() =>
  messageTypes.value.map((typeMessage) => ({
    name: typeMessage,
    label: typeMessage.toUpperCase(),
    icon: typeToIcon(typeMessage),
  })),
);

watch(
  messageTypes,
  (types) => {
    if (!types.length) return;
    if (!types.includes(activeType.value)) {
      activeType.value = types[0] ?? 'info';
    }
  },
  { immediate: true },
);

watch(
  projectId,
  async (id) => {
    projectMessageStore.stop();
    projectNotificationPreferenceStore.stop();
    projectTaskStore.stop();

    if (!id) return;

    const loadedProject = project.value ?? (await projectStore.getOne(id));
    if (!loadedProject) {
      toast.error('Progetto non trovato.');
      await router.replace({ name: 'project-dashboard' });
      return;
    }

    const userId = String(_Auth?.uid ?? '').trim();
    await Promise.all([
      projectMessageStore.startForProject(id),
      projectTaskStore.startForProject(id),
      projectNotificationPreferenceStore.startForProject(id, userId),
    ]);

    if (userId) {
      await projectNotificationPreferenceStore.ensureForProjectUser(id, userId, getUpdater());
    }
  },
  { immediate: true },
);

function getUpdater() {
  return String(_Auth?.uid ?? 'system');
}

async function publishMessage() {
  if (!projectId.value) return;

  const message = form.message.trim();
  if (!message) {
    toast.warning('Inserisci il messaggio.');
    return;
  }

  isPublishing.value = true;

  try {
    const result = await callPublishProjectMessage({
      projectId: projectId.value,
      typeMessage: normalizeMessageType(activeType.value),
      taskId: form.taskId.trim() || undefined,
      title: form.title.trim() || undefined,
      message,
      sourceLabel: 'HubCortex UI',
      sendPush: form.sendPush,
    });

    form.title = '';
    form.message = '';
    form.taskId = '';

    toast.success(
      `Messaggio pubblicato (${result.typeMessage}). Push utenti: ${result.sentUsers}, token: ${result.sentTokens}.`,
    );
  } catch (error) {
    toast.error(readErrorMessage(error));
  } finally {
    isPublishing.value = false;
  }
}

function isPushEnabledForType(typeMessage: string) {
  const userId = String(_Auth?.uid ?? '').trim();
  if (!projectId.value || !userId) return true;
  return projectNotificationPreferenceStore.isTypeEnabled(projectId.value, userId, typeMessage);
}

async function togglePushType(typeMessage: string) {
  const userId = String(_Auth?.uid ?? '').trim();
  if (!projectId.value || !userId) {
    toast.warning('Utente non disponibile.');
    return;
  }

  const enabled = isPushEnabledForType(typeMessage);
  await projectNotificationPreferenceStore.setTypeEnabled(
    projectId.value,
    userId,
    typeMessage,
    !enabled,
    getUpdater(),
  );
}

function formatDate(value: unknown) {
  if (!value) return '-';
  if (typeof value === 'object' && value && 'toDate' in value && typeof value.toDate === 'function') {
    try {
      return value.toDate().toLocaleString('it-IT');
    } catch {
      return '-';
    }
  }

  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleString('it-IT');
}

function typeToIcon(typeMessage: string) {
  if (typeMessage === 'error') return 'error';
  if (typeMessage === 'warning') return 'warning';
  if (typeMessage === 'info') return 'info';
  return 'label';
}

function messageTypeClass(typeMessage: string) {
  if (typeMessage === 'error') return 'text-bg-danger';
  if (typeMessage === 'warning') return 'text-bg-warning';
  if (typeMessage === 'info') return 'text-bg-info';
  return 'text-bg-secondary';
}

function readErrorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message?: unknown }).message ?? 'Errore non gestito.');
  }
  return 'Errore non gestito.';
}
</script>

<template>
  <div class="container-fluid pb-t overflow-auto h-100">
    <AppCard class="p-3 mb-3">
      <div class="d-flex flex-wrap justify-content-between gap-2 align-items-start">
        <div>
          <h1 class="h5 mb-1">Messaggi - {{ project?.name || '...' }}</h1>
          <div class="small text-secondary">Vista per tipo messaggio con side tabs e storico eventi progetto.</div>
        </div>
        <div class="d-flex flex-wrap gap-2">
          <RouterLink v-if="projectId" :to="{ name: 'project-board', params: { projectId } }" class="btn btn-sm btn-outline-primary">
            Torna alla board
          </RouterLink>
          <RouterLink :to="{ name: 'project-dashboard' }" class="btn btn-sm btn-outline-secondary">Dashboard</RouterLink>
        </div>
      </div>
    </AppCard>

    <div class="row g-3">
      <div class="col-12 col-xl-4">
        <AppCard class="p-3 mb-3">
          <h2 class="h6 mb-3">Nuovo messaggio</h2>
          <label class="form-label small">Tipo attivo</label>
          <div class="badge mb-2" :class="messageTypeClass(activeType)">{{ activeType || '-' }}</div>

          <label class="form-label small">Task collegato (opzionale)</label>
          <select v-model="form.taskId" class="form-select mb-2">
            <option value="">Nessun task</option>
            <option v-for="task in projectTasks" :key="task.id" :value="task.id">{{ task.title }}</option>
          </select>

          <label class="form-label small">Titolo (opzionale)</label>
          <input v-model="form.title" class="form-control mb-2" placeholder="Deploy failed" />

          <label class="form-label small">Messaggio</label>
          <textarea v-model="form.message" class="form-control mb-2" rows="4" placeholder="Dettagli evento..." />

          <div class="form-check mb-3">
            <input id="send-push-switch" v-model="form.sendPush" class="form-check-input" type="checkbox" />
            <label class="form-check-label" for="send-push-switch">Invia push</label>
          </div>

          <button class="btn btn-primary w-100" :disabled="isPublishing || !activeType" @click="publishMessage">
            {{ isPublishing ? 'Invio...' : 'Pubblica messaggio' }}
          </button>
        </AppCard>

        <AppCard class="p-3">
          <h2 class="h6 mb-2">Push per tipo (utente corrente)</h2>
          <div class="d-flex flex-column gap-2">
            <label v-for="typeMessage in messageTypes" :key="`push-${typeMessage}`" class="form-check form-switch">
              <input
                class="form-check-input"
                type="checkbox"
                :checked="isPushEnabledForType(typeMessage)"
                @change="togglePushType(typeMessage)"
              />
              <span class="form-check-label">{{ typeMessage }}</span>
            </label>
          </div>
        </AppCard>
      </div>

      <div class="col-12 col-xl-8">
        <AppCard class="p-0 overflow-hidden">
          <ContainerSideTabs
            v-model="activeType"
            :tabs="sideTabs"
            color="#F05454"
            route-query-key="type"
            :sidebar-min-width="230"
            content-class="px-0"
          >
            <div class="messages-pane p-3 p-md-4">
              <div v-if="!filteredMessages.length" class="text-secondary">Nessun messaggio per questo tipo.</div>

              <div v-else class="d-flex flex-column gap-3">
                <article
                  v-for="msg in filteredMessages"
                  :key="msg.id"
                  class="message-card border rounded-3 p-3"
                  :class="`message-card-${msg.typeMessage}`"
                >
                  <div class="d-flex justify-content-between align-items-center mb-2">
                    <div class="d-flex align-items-center gap-2 flex-wrap">
                      <span class="badge" :class="messageTypeClass(msg.typeMessage)">{{ msg.typeMessage }}</span>
                      <strong v-if="msg.title">{{ msg.title }}</strong>
                    </div>
                    <small class="text-secondary">{{ formatDate(msg.createdAt) }}</small>
                  </div>
                  <div class="mb-2" style="white-space: pre-wrap">{{ msg.message }}</div>
                  <div class="small text-secondary">
                    task: {{ msg.taskId || 'n/d' }} | source: {{ msg.sourceLabel || msg.sourceProjectId || 'interno' }}
                  </div>
                </article>
              </div>
            </div>
          </ContainerSideTabs>
        </AppCard>
      </div>
    </div>
  </div>
</template>

<style scoped>
.messages-pane {
  min-height: 65vh;
  background: linear-gradient(180deg, rgba(240, 84, 84, 0.04) 0%, rgba(255, 255, 255, 0.8) 100%);
}

.message-card {
  background: #fff;
  box-shadow: 0 10px 24px rgba(31, 42, 52, 0.08);
}

.message-card-error {
  border-left: 6px solid #dc3545 !important;
}

.message-card-warning {
  border-left: 6px solid #ffc107 !important;
}

.message-card-info {
  border-left: 6px solid #0dcaf0 !important;
}

.message-card-default {
  border-left: 6px solid #6c757d !important;
}
</style>
