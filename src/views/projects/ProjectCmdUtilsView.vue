<script setup lang="ts">
import { _Auth, FieldColorTag, FieldTiptap, toast, useChangeHeader, useStoreWatch, type ColorTag } from 'cic-kit';
import { computed, reactive, ref, watch } from 'vue';
import { Form } from 'vee-validate';
import { useRoute, useRouter } from 'vue-router';
import AppCard from '../../components/ui/AppCard.vue';
import ModalCmp from '../../components/ui/ModalCmp.vue';
import { projectCmdUtilStore } from '../../stores/projectCmdUtilStore';
import { projectStore } from '../../stores/projectStore';
import { projectTagStore } from '../../stores/projectTagStore';

useChangeHeader('Cmd Utils', { name: 'project-dashboard' });
useStoreWatch([{ store: projectStore }]);

const route = useRoute();
const router = useRouter();
const projectId = computed(() => String(route.params.projectId ?? '').trim());
const search = ref('');
const isSaving = ref(false);

const cmdModal = reactive({
  open: false,
  mode: 'create' as 'create' | 'edit',
  cmdId: '',
  label: '',
  command: '',
  description: '<p></p>',
  tag: [] as ColorTag[],
});

const project = computed(() => {
  if (!projectId.value) return undefined;
  return projectStore.items?.[projectId.value];
});

const cmdUtils = computed(() => {
  if (!projectId.value) return [];
  const query = search.value.trim().toLowerCase();
  const list = projectCmdUtilStore
    .forProject(projectId.value)
    .sort((a, b) => readTime(b.updatedAt) - readTime(a.updatedAt));

  if (!query) return list;

  return list.filter((item) => {
    return (
      item.label.toLowerCase().includes(query) ||
      item.command.toLowerCase().includes(query) ||
      stripHtml(item.description ?? '').toLowerCase().includes(query)
    );
  });
});

const tagsSuggestions = computed(() => {
  if (!projectId.value) return [];
  return projectTagStore.forProjectAsColorTags(projectId.value);
});

const selectedCmdDoc = computed(() => (cmdModal.cmdId ? projectCmdUtilStore.items?.[cmdModal.cmdId] : undefined));

watch(
  projectId,
  async (id) => {
    projectCmdUtilStore.stop();
    projectTagStore.stop();

    if (!id) return;

    const loadedProject = project.value ?? (await projectStore.getOne(id));
    if (!loadedProject) {
      toast.error('Progetto non trovato.');
      await router.replace({ name: 'project-dashboard' });
      return;
    }

    await Promise.all([projectCmdUtilStore.startForProject(id), projectTagStore.startForProject(id)]);
  },
  { immediate: true },
);

function openCreateCmd() {
  cmdModal.open = true;
  cmdModal.mode = 'create';
  cmdModal.cmdId = '';
  cmdModal.label = '';
  cmdModal.command = '';
  cmdModal.description = '<p></p>';
  cmdModal.tag = [];
}

function openEditCmd(cmdId: string) {
  const cmd = projectCmdUtilStore.items?.[cmdId];
  if (!cmd) return;

  cmdModal.open = true;
  cmdModal.mode = 'edit';
  cmdModal.cmdId = cmd.id;
  cmdModal.label = cmd.label;
  cmdModal.command = cmd.command;
  cmdModal.description = cmd.description || '<p></p>';
  cmdModal.tag = cmd.tag ?? [];
}

function closeModal() {
  cmdModal.open = false;
}

async function saveCmd() {
  if (!projectId.value) return;

  const label = cmdModal.label.trim();
  const command = cmdModal.command.trim();
  if (!label || !command) {
    toast.warning('Inserisci label e comando.');
    return;
  }

  isSaving.value = true;

  try {
    if (cmdModal.mode === 'edit' && selectedCmdDoc.value) {
      await selectedCmdDoc.value.update({
        label,
        command,
        description: cmdModal.description,
        tag: cmdModal.tag,
        updateBy: getUpdater(),
      });
      await projectTagStore.upsertForProject(projectId.value, cmdModal.tag, getUpdater());
      toast.success('Cmd util aggiornata.');
      closeModal();
      return;
    }

    await projectCmdUtilStore.add({
      projectId: projectId.value,
      label,
      command,
      description: cmdModal.description,
      tag: cmdModal.tag,
      updateBy: getUpdater(),
    });
    await projectTagStore.upsertForProject(projectId.value, cmdModal.tag, getUpdater());
    toast.success('Cmd util creata.');
    closeModal();
  } catch (error) {
    toast.error(readErrorMessage(error));
  } finally {
    isSaving.value = false;
  }
}

async function deleteCmd() {
  if (!selectedCmdDoc.value) return;
  const confirmed = window.confirm('Eliminare il comando?');
  if (!confirmed) return;
  await projectCmdUtilStore.delete(selectedCmdDoc.value.id);
  toast.success('Comando eliminato.');
  closeModal();
}

async function copyCommand(command: string) {
  try {
    await navigator.clipboard.writeText(command);
    toast.success('Comando copiato negli appunti.');
  } catch {
    toast.error('Impossibile copiare comando.');
  }
}

function getUpdater() {
  return String(_Auth?.uid ?? 'system');
}

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function readTime(value: unknown) {
  if (!value) return 0;
  if (typeof value === 'object' && value && 'toMillis' in value && typeof value.toMillis === 'function') {
    return Number(value.toMillis());
  }
  if (value instanceof Date) return value.getTime();
  const parsed = new Date(String(value)).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatDate(value: unknown) {
  const millis = readTime(value);
  if (!millis) return '-';
  return new Date(millis).toLocaleString('it-IT');
}

function readErrorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message?: unknown }).message ?? 'Errore non gestito.');
  }
  return 'Errore non gestito.';
}
</script>

<template>
  <div class="container pb-t overflow-auto h-100">
    <AppCard class="p-3 mb-3">
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-2">
        <div>
          <h1 class="h5 mb-1">Cmd Utils - {{ project?.name || '...' }}</h1>
          <div class="small text-secondary">Snippet comandi, utility operative e note tecniche.</div>
        </div>
        <div class="d-flex flex-wrap gap-2">
          <button class="btn btn-primary" @click="openCreateCmd">+ Nuovo comando</button>
          <RouterLink v-if="projectId" :to="{ name: 'project-board', params: { projectId } }" class="btn btn-outline-secondary">
            Board
          </RouterLink>
        </div>
      </div>
      <input v-model="search" class="form-control mt-3" type="search" placeholder="Cerca comando..." />
    </AppCard>

    <div class="row g-3">
      <div v-if="!cmdUtils.length" class="col-12 text-secondary">Nessun comando disponibile.</div>
      <div class="col-12 col-lg-6 col-xxl-4" v-for="cmd in cmdUtils" :key="cmd.id">
        <AppCard class="p-3 h-100 cmd-card">
          <div class="d-flex justify-content-between align-items-start mb-2 gap-2">
            <div class="fw-semibold">{{ cmd.label }}</div>
            <button class="btn btn-sm btn-outline-primary" @click="copyCommand(cmd.command)">Copia</button>
          </div>

          <code class="d-block p-2 rounded bg-light border mb-2 cmd-code">{{ cmd.command }}</code>
          <div class="small text-secondary mb-2">{{ stripHtml(cmd.description || '') || 'Nessuna descrizione.' }}</div>
          <div class="d-flex flex-wrap gap-1 mb-2" v-if="cmd.tag?.length">
            <span v-for="tag in cmd.tag" :key="`${cmd.id}-${tag.label}`" class="badge" :style="{ backgroundColor: tag.color }">
              {{ tag.label }}
            </span>
          </div>
          <div class="d-flex justify-content-between align-items-center small text-secondary">
            <span>{{ formatDate(cmd.updatedAt || cmd.createdAt) }}</span>
            <button class="btn btn-sm btn-outline-dark" @click="openEditCmd(cmd.id)">Apri</button>
          </div>
        </AppCard>
      </div>
    </div>

    <ModalCmp
      v-model="cmdModal.open"
      :title="cmdModal.mode === 'create' ? 'Nuovo comando' : 'Dettaglio comando'"
      size="xl"
      centered
      scrollable
      cancel-text="Chiudi"
      ok-text="Salva"
      :on-ok="saveCmd"
    >
      <Form class="d-flex flex-column gap-3">
        <div class="row g-2">
          <div class="col-12 col-lg-5">
            <label class="form-label small">Label</label>
            <input v-model="cmdModal.label" class="form-control" placeholder="Build production" />
          </div>
          <div class="col-12 col-lg-7">
            <label class="form-label small">Comando</label>
            <input v-model="cmdModal.command" class="form-control font-monospace" placeholder="npm run build" />
          </div>
        </div>
        <div>
          <label class="form-label small">Tag condivisi</label>
          <FieldColorTag
            name="cmd_tags"
            v-model="cmdModal.tag"
            :suggestions="tagsSuggestions"
            placeholder="Aggiungi tag condivisi"
          />
        </div>
        <div>
          <label class="form-label small">Descrizione</label>
          <FieldTiptap
            name="cmd_description"
            v-model="cmdModal.description"
            placeholder="Spiega quando usare questo comando..."
            :toolbar-sticky-on="'top'"
          />
        </div>
        <div class="d-flex justify-content-between align-items-center">
          <button class="btn btn-outline-danger" v-if="cmdModal.mode === 'edit'" :disabled="isSaving" @click.prevent="deleteCmd">
            Elimina comando
          </button>
          <div class="small text-secondary ms-auto" v-if="isSaving">Salvataggio...</div>
        </div>
      </Form>
    </ModalCmp>
  </div>
</template>

<style scoped>
.cmd-card {
  border-top: 4px solid rgba(48, 71, 94, 0.7);
}

.cmd-code {
  white-space: pre-wrap;
}
</style>
