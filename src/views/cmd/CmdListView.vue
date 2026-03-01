<script setup lang="ts">
import {
  _Auth,
  Btn,
  FieldColorTag,
  FieldTiptap,
  Modal,
  toast,
  useChangeHeader,
  useHeaderExtra,
  useStoreWatch,
  type ColorTag,
} from 'cic-kit';
import { computed, reactive, ref } from 'vue';
import { Form } from 'vee-validate';
import AppCard from '../../components/ui/AppCard.vue';
import { cmdStore } from '../../stores/cmdStore';
import { tagStore } from '../../stores/tagStore';
import CmdHeaderExtra from './CmdHeaderExtra.vue';

useChangeHeader('Cmd', { name: 'home' });
useStoreWatch([
  { store: cmdStore },
  { store: tagStore },
]);

const search = ref('');
const isSaving = ref(false);

const cmdModal = reactive({
  open: false,
  mode: 'create' as 'create' | 'edit',
  cmdId: '',
  title: '',
  command: '',
  description: '<p></p>',
  tag: [] as ColorTag[],
});

const cmdItems = computed(() => {
  const query = search.value.trim().toLowerCase();
  const list = [...cmdStore.itemsActiveArray].sort((a, b) => readTime(b.updatedAt) - readTime(a.updatedAt));
  if (!query) return list;

  return list.filter((item) => {
    return (
      item.title.toLowerCase().includes(query) ||
      item.command.toLowerCase().includes(query) ||
      stripHtml(item.description ?? '').toLowerCase().includes(query)
    );
  });
});

const tagsSuggestions = computed(() => tagStore.asColorTags());
const selectedCmdDoc = computed(() => (cmdModal.cmdId ? cmdStore.items?.[cmdModal.cmdId] : undefined));

function openCreateCmd() {
  cmdModal.open = true;
  cmdModal.mode = 'create';
  cmdModal.cmdId = '';
  cmdModal.title = '';
  cmdModal.command = '';
  cmdModal.description = '<p></p>';
  cmdModal.tag = [];
}

function openEditCmd(cmdId: string) {
  const cmd = cmdStore.items?.[cmdId];
  if (!cmd) return;

  cmdModal.open = true;
  cmdModal.mode = 'edit';
  cmdModal.cmdId = cmd.id;
  cmdModal.title = cmd.title;
  cmdModal.command = cmd.command;
  cmdModal.description = cmd.description || '<p></p>';
  cmdModal.tag = cmd.tag ?? [];
}

function closeModal() {
  cmdModal.open = false;
}

async function saveCmd() {
  const title = cmdModal.title.trim();
  const command = cmdModal.command.trim();
  if (!title || !command) {
    toast.warning('Inserisci titolo e comando.');
    return;
  }

  isSaving.value = true;
  try {
    if (cmdModal.mode === 'edit' && selectedCmdDoc.value) {
      await selectedCmdDoc.value.update({
        title,
        command,
        description: cmdModal.description,
        tag: cmdModal.tag,
        updateBy: getUpdater(),
      });
      await tagStore.upsert(cmdModal.tag, getUpdater());
      toast.success('Comando aggiornato.');
      closeModal();
      return;
    }

    await cmdStore.add({
      title,
      command,
      description: cmdModal.description,
      tag: cmdModal.tag,
      updateBy: getUpdater(),
    });
    await tagStore.upsert(cmdModal.tag, getUpdater());
    toast.success('Comando creato.');
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

  await cmdStore.delete(selectedCmdDoc.value.id);
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

useHeaderExtra(CmdHeaderExtra, { onCreate: openCreateCmd });
</script>

<template>
  <div class="container pb-t overflow-auto h-100">
    <div class="search-bar-wrap">
      <input v-model="search" class="form-control" type="search" placeholder="Cerca comando..." />
    </div>

    <div class="row g-3">
      <div v-if="!cmdItems.length" class="col-12 text-secondary">Nessun comando disponibile.</div>

      <div class="col-12 col-lg-6 col-xxl-4" v-for="cmd in cmdItems" :key="cmd.id">
        <AppCard class="p-3 h-100 cmd-card">
          <div class="d-flex justify-content-between align-items-start mb-2 gap-2">
            <div class="fw-semibold text-truncate" :title="cmd.title">{{ cmd.title }}</div>
            <div class="d-flex align-items-center gap-1">
              <Btn variant="ghost" color="primary" icon="content_copy" tooltip="Copia comando" @click="copyCommand(cmd.command)" />
              <Btn variant="ghost" color="dark" icon="edit" tooltip="Apri" @click="openEditCmd(cmd.id)" />
            </div>
          </div>

          <code class="d-block p-2 rounded bg-light border mb-2 cmd-code">{{ cmd.command }}</code>
          <div class="small text-secondary mb-2 cmd-preview">{{ stripHtml(cmd.description || '') || 'Nessuna descrizione.' }}</div>

          <div class="d-flex flex-wrap gap-1 mb-2" v-if="cmd.tag?.length">
            <span v-for="tag in cmd.tag" :key="`${cmd.id}-${tag.label}`" class="badge" :style="{ backgroundColor: tag.color }">
              {{ tag.label }}
            </span>
          </div>

          <div class="small text-secondary mt-auto">
            {{ formatDate(cmd.updatedAt || cmd.createdAt) }}
          </div>
        </AppCard>
      </div>
    </div>

    <Modal
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
            <label class="form-label small">Titolo</label>
            <input v-model="cmdModal.title" class="form-control" placeholder="Build production" />
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
          <Btn
            v-if="cmdModal.mode === 'edit'"
            variant="outline"
            color="danger"
            icon="delete"
            :disabled="isSaving"
            @click.prevent="deleteCmd"
          >
            Elimina comando
          </Btn>
          <div class="small text-secondary ms-auto" v-if="isSaving">Salvataggio...</div>
        </div>
      </Form>
    </Modal>
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

.cmd-card {
  border-top: 4px solid rgba(48, 71, 94, 0.7);
}

.cmd-code {
  white-space: pre-wrap;
}

.cmd-preview {
  max-height: 4.8em;
  overflow: hidden;
}
</style>
