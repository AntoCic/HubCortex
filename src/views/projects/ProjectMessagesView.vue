<script setup lang="ts">
import { _Auth, Btn, ContainerSideTabs, toast, useChangeHeader, useStoreWatch, type SideTabs } from 'cic-kit';
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { callPublishProjectMessage } from '../../call/callProjectMessageRelay';
import { normalizeMessageType, normalizeProjectMessageTypes } from '../../models/Project';
import { canWriteProjects } from '../../permissions';
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
const copiedPreviewMessageId = ref('');
const sendPush = ref(true);
const isPublishing = ref(false);
const canWriteProjectData = computed(() => canWriteProjects(_Auth?.user?.permissions));

const project = computed(() => (projectId.value ? projectStore.items?.[projectId.value] : undefined));
const messageTypes = computed(() => orderMessageTypes(normalizeProjectMessageTypes(project.value?.typeMessage)));
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

function orderMessageTypes(value: string[]) {
  const normalized = value.map((item) => normalizeMessageType(item)).filter(Boolean);
  const deployIndex = normalized.indexOf('deploy');
  if (deployIndex <= 0) {
    return normalized;
  }

  const deployType = normalized[deployIndex];
  if (!deployType) {
    return normalized;
  }

  const others = normalized.filter((_, index) => index !== deployIndex);
  return [deployType, ...others];
}

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
  if (!canWriteProjectData.value) {
    toast.warning('Permesso PROJECT_WRITE richiesto.');
    return;
  }

  const apiKey = String(project.value?.apiKey ?? '').trim();
  if (!apiKey) {
    toast.error('API key progetto non disponibile.');
    return;
  }

  const normalizedMessage = message.value.trim();
  if (!normalizedMessage) {
    toast.warning('Inserisci il messaggio.');
    return;
  }

  isPublishing.value = true;
  try {
    const result = await callPublishProjectMessage({
      apiKey,
      typeMessage: normalizeMessageType(activeType.value),
      message: normalizedMessage,
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
  if (typeMessage === 'deploy') return 'rocket_launch';
  return 'label';
}

function messageTypeClass(typeMessage: string) {
  if (typeMessage === 'error') return 'text-bg-danger';
  if (typeMessage === 'warning') return 'text-bg-warning';
  if (typeMessage === 'info') return 'text-bg-info';
  if (typeMessage === 'deploy') return 'text-bg-success';
  return 'text-bg-secondary';
}

function asPayloadObject(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function hasPayloadObject(value: unknown) {
  return !!asPayloadObject(value);
}

function formatPayload(value: unknown) {
  const payload = asPayloadObject(value);
  if (!payload) return '';
  try {
    return JSON.stringify(payload, null, 2);
  } catch {
    return '';
  }
}

function normalizeHttpUrl(value: unknown) {
  const input = String(value ?? '').trim();
  if (!input) return '';

  try {
    const parsed = new URL(input);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return '';
    return parsed.toString();
  } catch {
    return '';
  }
}

function previewUrlForMessage(msg: { typeMessage: string; payload?: Record<string, unknown> }) {
  if (normalizeMessageType(msg.typeMessage) !== 'deploy') return '';
  const payload = asPayloadObject(msg.payload);
  if (!payload) return '';
  return normalizeHttpUrl(payload.preview);
}

async function copyTextToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', 'true');
  textarea.style.position = 'absolute';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  document.body.removeChild(textarea);
  if (!copied) {
    throw new Error('Clipboard copy failed');
  }
}

async function copyPreviewUrl(url: string, messageId: string) {
  if (!url) return;

  try {
    await copyTextToClipboard(url);
    copiedPreviewMessageId.value = messageId;
    toast.success('Link preview copiato.');
    window.setTimeout(() => {
      if (copiedPreviewMessageId.value === messageId) {
        copiedPreviewMessageId.value = '';
      }
    }, 2000);
  } catch {
    toast.error('Impossibile copiare il link.');
  }
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

              <div v-if="previewUrlForMessage(msg)" class="deploy-preview mt-2">
                <span class="small text-secondary">Preview:</span>
                <a
                  class="deploy-preview-link"
                  :href="previewUrlForMessage(msg)"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {{ previewUrlForMessage(msg) }}
                </a>
                <Btn
                  variant="ghost"
                  color="dark"
                  icon="content_copy"
                  tooltip="Copia link preview"
                  @click="copyPreviewUrl(previewUrlForMessage(msg), msg.id)"
                />
                <small v-if="copiedPreviewMessageId === msg.id" class="text-success">Copiato</small>
              </div>

              <pre v-if="hasPayloadObject(msg.payload)" class="payload-box">{{ formatPayload(msg.payload) }}</pre>
            </article>
          </div>
        </div>

        <div class="messages-compose">
          <div v-if="!canWriteProjectData" class="small text-secondary mb-2">
            Modalita sola lettura: serve `PROJECT_WRITE` per pubblicare messaggi.
          </div>
          <textarea
            v-model="message"
            class="form-control mb-2"
            rows="3"
            placeholder="Scrivi un messaggio..."
            :disabled="!canWriteProjectData"
            @keydown.ctrl.enter.prevent="publishMessage"
          />
          <div class="d-flex justify-content-between align-items-center gap-2">
            <label class="form-check form-switch mb-0">
              <input class="form-check-input" type="checkbox" v-model="sendPush" :disabled="!canWriteProjectData" />
              <span class="form-check-label">Invia push</span>
            </label>

            <Btn
              variant="solid"
              color="primary"
              icon="send"
              :loading="isPublishing"
              :disabled="!canWriteProjectData || isPublishing || !message.trim()"
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

.message-item-deploy {
  border-left: 5px solid #198754 !important;
}

.deploy-preview {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
  border: 1px solid rgba(25, 135, 84, 0.3);
  background: rgba(25, 135, 84, 0.08);
  border-radius: 0.45rem;
  padding: 0.35rem 0.55rem;
}

.deploy-preview-link {
  color: #0d6efd;
  text-decoration: none;
  word-break: break-all;
}

.deploy-preview-link:hover {
  text-decoration: underline;
}

.payload-box {
  margin: 0.7rem 0 0 0;
  border: 1px solid rgba(0, 0, 0, 0.12);
  background: rgba(248, 249, 250, 0.95);
  border-radius: 0.45rem;
  padding: 0.65rem 0.75rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace;
  font-size: 0.8rem;
  line-height: 1.35;
  color: #2f3d4a;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
