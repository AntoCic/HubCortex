<script setup lang="ts">
import { _Auth, Btn, ContainerSideTabs, toast, useChangeHeader, useStoreWatch, type SideTabs } from 'cic-kit';
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { callPublishProjectMessage } from '../../call/callPublishProjectMessage';
import { normalizeMessageType, normalizeProjectMessageTypes } from '../../models/Project';
import { projectMessageStore } from '../../stores/projectMessageStore';
import { projectNotificationPreferenceStore } from '../../stores/projectNotificationPreferenceStore';
import { projectStore } from '../../stores/projectStore';

useChangeHeader('Messaggi Progetto', { name: 'project-dashboard' });
useStoreWatch([{ store: projectStore }]);

const route = useRoute();
const router = useRouter();
const projectId = computed(() => String(route.params.projectId ?? '').trim());
const activeType = ref('');
const message = ref('');
const sendPush = ref(true);
const isPublishing = ref(false);

const project = computed(() => (projectId.value ? projectStore.items?.[projectId.value] : undefined));
const messageTypes = computed(() => normalizeProjectMessageTypes(project.value?.typeMessage));
const allProjectMessages = computed(() => (projectId.value ? projectMessageStore.forProject(projectId.value) : []));
const filteredMessages = computed(() =>
  allProjectMessages.value.filter((item) => item.typeMessage === normalizeMessageType(activeType.value))
);

const sideTabs = computed<SideTabs>(() =>
  messageTypes.value.map((typeMessage) => ({
    name: typeMessage,
    label: typeMessage.toUpperCase(),
    icon: typeToIcon(typeMessage),
  }))
);

watch(
  messageTypes,
  (types) => {
    if (!types.length) return;
    if (!types.includes(activeType.value)) {
      activeType.value = types[0] ?? 'info';
    }
  },
  { immediate: true }
);

watch(
  projectId,
  async (id) => {
    projectMessageStore.stop();
    projectNotificationPreferenceStore.stop();

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
      projectNotificationPreferenceStore.startForProject(id, userId),
    ]);

    if (userId) {
      await projectNotificationPreferenceStore.ensureForProjectUser(id, userId, getUpdater());
    }
  },
  { immediate: true }
);

function getUpdater() {
  return String(_Auth?.uid ?? 'system');
}

async function publishMessage() {
  if (!projectId.value) return;

  const normalizedMessage = message.value.trim();
  if (!normalizedMessage) {
    toast.warning('Inserisci il messaggio.');
    return;
  }

  isPublishing.value = true;
  try {
    const result = await callPublishProjectMessage({
      projectId: projectId.value,
      typeMessage: normalizeMessageType(activeType.value),
      message: normalizedMessage,
      sourceLabel: 'HubCortex UI',
      sendPush: sendPush.value,
    });

    message.value = '';
    toast.success(
      `Messaggio pubblicato (${result.typeMessage}). Push utenti: ${result.sentUsers}, token: ${result.sentTokens}.`
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

async function toggleCurrentTypePush() {
  const userId = String(_Auth?.uid ?? '').trim();
  const typeMessage = normalizeMessageType(activeType.value);
  if (!projectId.value || !userId || !typeMessage) {
    toast.warning('Utente o tab non disponibili.');
    return;
  }

  const enabled = isPushEnabledForType(typeMessage);
  await projectNotificationPreferenceStore.setTypeEnabled(projectId.value, userId, typeMessage, !enabled, getUpdater());
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
  <div class="container-fluid pb-t h-100">
    <ContainerSideTabs
      v-model="activeType"
      :tabs="sideTabs"
      color="#F05454"
      route-query-key="type"
      :sidebar-min-width="220"
      content-class="h-100 px-0"
      class="h-100"
    >
      <div class="messages-layout">
        <div class="messages-top">
          <div class="d-flex justify-content-between align-items-center gap-2 flex-wrap">
            <div class="d-flex align-items-center gap-2">
              <RouterLink class="text-decoration-none" :to="{ name: 'project-dashboard' }">
                <Btn variant="ghost" icon="arrow_back_ios" tooltip="Dashboard progetti" />
              </RouterLink>
              <div class="fw-semibold text-uppercase">{{ activeType || '-' }}</div>
              <small class="text-secondary">{{ project?.name || '...' }}</small>
            </div>

            <label class="form-check form-switch mb-0">
              <input
                class="form-check-input"
                type="checkbox"
                :checked="isPushEnabledForType(activeType)"
                @change="toggleCurrentTypePush"
              />
              <span class="form-check-label">Notifiche push tab corrente</span>
            </label>
          </div>
        </div>

        <div class="messages-scroll">
          <div v-if="!filteredMessages.length" class="text-secondary">Nessun messaggio per questa tab.</div>

          <div v-else class="d-flex flex-column gap-3">
            <article
              v-for="msg in filteredMessages"
              :key="msg.id"
              class="message-item border rounded-3 p-3"
              :class="`message-item-${msg.typeMessage}`"
            >
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="badge" :class="messageTypeClass(msg.typeMessage)">{{ msg.typeMessage }}</span>
                <small class="text-secondary">{{ formatDate(msg.createdAt) }}</small>
              </div>
              <div style="white-space: pre-wrap">{{ msg.message }}</div>
            </article>
          </div>
        </div>

        <div class="messages-compose">
          <textarea
            v-model="message"
            class="form-control mb-2"
            rows="3"
            placeholder="Scrivi un messaggio..."
            @keydown.ctrl.enter.prevent="publishMessage"
          />
          <div class="d-flex justify-content-between align-items-center gap-2">
            <label class="form-check form-switch mb-0">
              <input class="form-check-input" type="checkbox" v-model="sendPush" />
              <span class="form-check-label">Invia push</span>
            </label>

            <Btn
              variant="solid"
              color="primary"
              icon="send"
              :loading="isPublishing"
              :disabled="isPublishing || !message.trim()"
              tooltip="Invia (Ctrl+Invio)"
              @click="publishMessage"
            />
          </div>
        </div>
      </div>
    </ContainerSideTabs>
  </div>
</template>

<style scoped>
.messages-layout {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, rgba(240, 84, 84, 0.04) 0%, rgba(255, 255, 255, 0.9) 100%);
}

.messages-top {
  padding: 0.8rem 1rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.9);
}

.messages-scroll {
  flex: 1;
  overflow: auto;
  padding: 1rem;
}

.messages-compose {
  padding: 0.8rem 1rem;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.95);
}

.message-item {
  background: #fff;
  box-shadow: 0 8px 18px rgba(31, 42, 52, 0.08);
}

.message-item-error {
  border-left: 5px solid #dc3545 !important;
}

.message-item-warning {
  border-left: 5px solid #ffc107 !important;
}

.message-item-info {
  border-left: 5px solid #0dcaf0 !important;
}
</style>
