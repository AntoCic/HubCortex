<script setup lang="ts">
import { Btn, headerStore, toast, useChangeHeader, useHeaderExtra, useStoreWatch } from 'cic-kit';
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import AppCard from '../../components/ui/AppCard.vue';
import { noteStore } from '../../stores/noteStore';
import { cleanTitle } from './cleanTitle';
import NotesHeaderExtra from './NotesHeaderExtra.vue';

type NotesFilter = 'notes' | 'trash';

useChangeHeader('Note', { name: 'home' });
useStoreWatch([{ store: noteStore }]);

const router = useRouter();
const search = ref('');
const filter = ref<NotesFilter>('notes');

watch(
  filter,
  (value) => {
    headerStore.title = value === 'trash' ? 'Cestino' : 'Note';
  },
  { immediate: true }
);

const notes = computed(() => {
  const query = search.value.trim().toLowerCase();
  const base = filter.value === 'trash' ? noteStore.itemsDeletedArray : noteStore.itemsActiveArray;

  const sorted = [...base].sort((a, b) => readTime(b.updatedAt || b.createdAt) - readTime(a.updatedAt || a.createdAt));
  if (!query) return sorted;

  return sorted.filter((item) => {
    const title = item.title.toLowerCase();
    const text = stripHtml(item.content).toLowerCase();
    const tags = (item.tag ?? []).map((tag) => tag.label.toLowerCase()).join(' ');
    return title.includes(query) || text.includes(query) || tags.includes(query);
  });
});

const emptyMessage = computed(() =>
  filter.value === 'trash'
    ? 'Cestino vuoto.'
    : 'Nessuna nota disponibile. Crea la tua prima nota dal pulsante in alto.'
);

function onSelectFilter(value: NotesFilter) {
  filter.value = value;
}

function openCreate() {
  void router.push({ name: 'note-new' });
}

function openNote(noteId: string) {
  const note = noteStore.items?.[noteId];
  if (!note || note.isDeleted) return;
  void router.push({ name: 'note-edit', params: { noteId } });
}

async function softDelete(noteId: string) {
  const note = noteStore.items?.[noteId];
  if (!note || note.isDeleted) return;

  await note.softDelete();
  toast.success('Nota spostata nel cestino.');
}

async function restore(noteId: string) {
  const note = noteStore.items?.[noteId];
  if (!note || !note.isDeleted) return;

  await note.restore();
  toast.success('Nota ripristinata.');
}

async function deleteForever(noteId: string) {
  const note = noteStore.items?.[noteId];
  if (!note) return;

  const confirmed = window.confirm('Eliminare definitivamente la nota?');
  if (!confirmed) return;

  await noteStore.delete(noteId);
  toast.success('Nota eliminata definitivamente.');
}

function readDisplayTitle(title: string, content: string) {
  const normalized = title.trim();
  if (normalized) return normalized;
  const fallback = cleanTitle(content, 40);
  return fallback || 'Senza titolo';
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

useHeaderExtra(NotesHeaderExtra, { onCreate: openCreate, onSelectFilter });
</script>

<template>
  <div class="container pb-t overflow-auto h-100">
    <div class="search-bar-wrap">
      <input
        v-model="search"
        class="form-control"
        type="search"
        :placeholder="filter === 'trash' ? 'Cerca nel cestino...' : 'Cerca note...'"
      />
    </div>

    <div v-if="!notes.length" class="text-secondary px-1">{{ emptyMessage }}</div>

    <div v-else class="row g-3">
      <div class="col-12 col-lg-6 col-xl-4" v-for="note in notes" :key="note.id">
        <AppCard
          class="p-3 note-card h-100 d-flex flex-column"
          :class="{ 'note-card-clickable': !note.isDeleted }"
          :role="note.isDeleted ? undefined : 'button'"
          :tabindex="note.isDeleted ? -1 : 0"
          @click="openNote(note.id)"
          @keydown.enter.prevent="openNote(note.id)"
          @keydown.space.prevent="openNote(note.id)"
        >
          <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
            <div
              class="fw-semibold text-truncate flex-grow-1"
              :class="{ 'text-muted text-decoration-line-through': note.isDeleted }"
              :title="readDisplayTitle(note.title, note.content)"
            >
              {{ readDisplayTitle(note.title, note.content) }}
            </div>

            <div class="d-flex align-items-center gap-1">
              <Btn
                v-if="!note.isDeleted"
                variant="ghost"
                color="danger"
                icon="delete"
                tooltip="Sposta nel cestino"
                @click.stop="softDelete(note.id)"
              />
              <Btn
                v-if="note.isDeleted"
                variant="ghost"
                color="warning"
                icon="restore_from_trash"
                tooltip="Ripristina"
                @click.stop="restore(note.id)"
              />
              <Btn
                v-if="note.isDeleted"
                variant="ghost"
                color="danger"
                icon="delete_forever"
                tooltip="Elimina definitivamente"
                @click.stop="deleteForever(note.id)"
              />
            </div>
          </div>

          <div class="small text-secondary mb-2 note-preview">
            {{ stripHtml(note.content) || 'Nessun contenuto.' }}
          </div>

          <div class="d-flex flex-wrap gap-1 mt-auto" v-if="note.tag?.length">
            <span v-for="tag in note.tag" :key="`${note.id}-${tag.label}`" class="badge" :style="{ backgroundColor: tag.color }">
              {{ tag.label }}
            </span>
          </div>

          <div class="small text-secondary mt-2">
            {{ formatDate(note.isDeleted ? note.deleteAt || note.updatedAt || note.createdAt : note.updatedAt || note.createdAt) }}
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

.note-card {
  border-top: 4px solid rgba(240, 84, 84, 0.65);
}

.note-card-clickable {
  cursor: pointer;
}

.note-preview {
  max-height: 4.5em;
  overflow: hidden;
}
</style>
