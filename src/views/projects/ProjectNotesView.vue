<script setup lang="ts">
import { _Auth, FieldColorTag, FieldTiptap, toast, useChangeHeader, useStoreWatch, type ColorTag } from 'cic-kit';
import { computed, reactive, ref, watch } from 'vue';
import { Form } from 'vee-validate';
import { useRoute, useRouter } from 'vue-router';
import AppCard from '../../components/ui/AppCard.vue';
import ModalCmp from '../../components/ui/ModalCmp.vue';
import { projectNoteStore } from '../../stores/projectNoteStore';
import { projectStore } from '../../stores/projectStore';
import { projectTagStore } from '../../stores/projectTagStore';

useChangeHeader('Note Progetto', { name: 'project-dashboard' });
useStoreWatch([{ store: projectStore }]);

const route = useRoute();
const router = useRouter();
const projectId = computed(() => String(route.params.projectId ?? '').trim());
const search = ref('');
const isSaving = ref(false);

const noteModal = reactive({
  open: false,
  mode: 'create' as 'create' | 'edit',
  noteId: '',
  title: '',
  content: '<p></p>',
  tag: [] as ColorTag[],
});

const project = computed(() => {
  if (!projectId.value) return undefined;
  return projectStore.items?.[projectId.value];
});

const notes = computed(() => {
  if (!projectId.value) return [];
  const query = search.value.trim().toLowerCase();
  const list = projectNoteStore.forProject(projectId.value).sort((a, b) => readTime(b.updatedAt) - readTime(a.updatedAt));

  if (!query) return list;

  return list.filter((item) => {
    const title = item.title.toLowerCase();
    const text = stripHtml(item.content).toLowerCase();
    return title.includes(query) || text.includes(query);
  });
});

const tagsSuggestions = computed(() => {
  if (!projectId.value) return [];
  return projectTagStore.forProjectAsColorTags(projectId.value);
});

const selectedNoteDoc = computed(() => (noteModal.noteId ? projectNoteStore.items?.[noteModal.noteId] : undefined));

watch(
  projectId,
  async (id) => {
    projectNoteStore.stop();
    projectTagStore.stop();

    if (!id) return;

    const loadedProject = project.value ?? (await projectStore.getOne(id));
    if (!loadedProject) {
      toast.error('Progetto non trovato.');
      await router.replace({ name: 'project-dashboard' });
      return;
    }

    await Promise.all([projectNoteStore.startForProject(id), projectTagStore.startForProject(id)]);
  },
  { immediate: true },
);

function openCreateNote() {
  noteModal.open = true;
  noteModal.mode = 'create';
  noteModal.noteId = '';
  noteModal.title = '';
  noteModal.content = '<p></p>';
  noteModal.tag = [];
}

function openEditNote(noteId: string) {
  const note = projectNoteStore.items?.[noteId];
  if (!note) return;

  noteModal.open = true;
  noteModal.mode = 'edit';
  noteModal.noteId = note.id;
  noteModal.title = note.title;
  noteModal.content = note.content;
  noteModal.tag = note.tag ?? [];
}

function closeModal() {
  noteModal.open = false;
}

async function saveNote() {
  if (!projectId.value) return;

  const title = noteModal.title.trim();
  if (!title) {
    toast.warning('Inserisci titolo nota.');
    return;
  }

  isSaving.value = true;

  try {
    if (noteModal.mode === 'edit' && selectedNoteDoc.value) {
      await selectedNoteDoc.value.update({
        title,
        content: noteModal.content,
        tag: noteModal.tag,
        updateBy: getUpdater(),
      });
      await projectTagStore.upsertForProject(projectId.value, noteModal.tag, getUpdater());
      toast.success('Nota aggiornata.');
      closeModal();
      return;
    }

    await projectNoteStore.add({
      projectId: projectId.value,
      title,
      content: noteModal.content,
      tag: noteModal.tag,
      updateBy: getUpdater(),
    });
    await projectTagStore.upsertForProject(projectId.value, noteModal.tag, getUpdater());
    toast.success('Nota creata.');
    closeModal();
  } catch (error) {
    toast.error(readErrorMessage(error));
  } finally {
    isSaving.value = false;
  }
}

async function deleteNote() {
  if (!selectedNoteDoc.value) return;
  const confirmed = window.confirm('Eliminare la nota?');
  if (!confirmed) return;

  await projectNoteStore.delete(selectedNoteDoc.value.id);
  toast.success('Nota eliminata.');
  closeModal();
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
          <h1 class="h5 mb-1">Note - {{ project?.name || '...' }}</h1>
          <div class="small text-secondary">Area note condivisa del progetto.</div>
        </div>
        <div class="d-flex flex-wrap gap-2">
          <button class="btn btn-primary" @click="openCreateNote">+ Nuova nota</button>
          <RouterLink v-if="projectId" :to="{ name: 'project-board', params: { projectId } }" class="btn btn-outline-secondary">
            Board
          </RouterLink>
        </div>
      </div>
      <input v-model="search" class="form-control mt-3" type="search" placeholder="Cerca note..." />
    </AppCard>

    <div class="row g-3">
      <div v-if="!notes.length" class="col-12 text-secondary">Nessuna nota disponibile.</div>
      <div class="col-12 col-lg-6 col-xl-4" v-for="note in notes" :key="note.id">
        <AppCard class="p-3 note-tile h-100">
          <button class="btn w-100 h-100 text-start p-0 border-0 bg-transparent" @click="openEditNote(note.id)">
            <div class="fw-semibold mb-2">{{ note.title }}</div>
            <div class="small text-secondary mb-3 note-preview">{{ stripHtml(note.content) || 'Nessun contenuto' }}</div>
            <div class="d-flex flex-wrap gap-1 mb-2" v-if="note.tag?.length">
              <span v-for="tag in note.tag" :key="`${note.id}-${tag.label}`" class="badge" :style="{ backgroundColor: tag.color }">
                {{ tag.label }}
              </span>
            </div>
            <div class="small text-secondary">aggiornata: {{ formatDate(note.updatedAt || note.createdAt) }}</div>
          </button>
        </AppCard>
      </div>
    </div>

    <ModalCmp
      v-model="noteModal.open"
      :title="noteModal.mode === 'create' ? 'Nuova nota' : 'Dettaglio nota'"
      size="xl"
      centered
      scrollable
      cancel-text="Chiudi"
      ok-text="Salva"
      :on-ok="saveNote"
    >
      <Form class="d-flex flex-column gap-3">
        <div>
          <label class="form-label small">Titolo</label>
          <input v-model="noteModal.title" class="form-control" placeholder="Runbook deploy frontend" />
        </div>
        <div>
          <label class="form-label small">Tag condivisi</label>
          <FieldColorTag
            name="note_tags"
            v-model="noteModal.tag"
            :suggestions="tagsSuggestions"
            placeholder="Aggiungi tag condivisi"
          />
        </div>
        <div>
          <label class="form-label small">Contenuto</label>
          <FieldTiptap
            name="note_content"
            v-model="noteModal.content"
            placeholder="Scrivi contenuto nota..."
            :toolbar-sticky-on="'top'"
          />
        </div>
        <div class="d-flex justify-content-between align-items-center">
          <button class="btn btn-outline-danger" v-if="noteModal.mode === 'edit'" :disabled="isSaving" @click.prevent="deleteNote">
            Elimina nota
          </button>
          <div class="small text-secondary ms-auto" v-if="isSaving">Salvataggio...</div>
        </div>
      </Form>
    </ModalCmp>
  </div>
</template>

<style scoped>
.note-tile {
  border-left: 4px solid rgba(240, 84, 84, 0.65);
}

.note-preview {
  max-height: 4.8em;
  overflow: hidden;
}
</style>
