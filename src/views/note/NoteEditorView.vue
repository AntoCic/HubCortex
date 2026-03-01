<script setup lang="ts">
import {
  _Auth,
  FieldColorTag,
  FieldTiptap,
  toast,
  useChangeHeader,
  useHeaderExtra,
  useStoreWatch,
  type ColorTag,
} from 'cic-kit';
import { computed, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { noteStore } from '../../stores/noteStore';
import { tagStore } from '../../stores/tagStore';
import { cleanTitle } from './cleanTitle';
import NoteEditorHeaderExtra from './NoteEditorHeaderExtra.vue';

useChangeHeader('Nota', { name: 'notes' });
useStoreWatch([
  { store: noteStore },
  { store: tagStore },
]);

const route = useRoute();
const router = useRouter();
const isSaving = ref(false);

const noteId = computed(() => String(route.params.noteId ?? '').trim());
const isCreate = computed(() => route.name === 'note-new' || !noteId.value);
const noteDoc = computed(() => (isCreate.value ? undefined : noteStore.items?.[noteId.value]));
const tagsSuggestions = computed(() => tagStore.asColorTags());

const form = reactive({
  title: '',
  content: '<p></p>',
  tag: [] as ColorTag[],
});

const titlePlaceholder = computed(() => form.title || cleanTitle(form.content, 40) || 'Inserisci un titolo...');

watch(
  [isCreate, noteId],
  async ([createMode, currentId]) => {
    if (createMode) {
      form.title = '';
      form.content = '<p></p>';
      form.tag = [];
      return;
    }

    if (!currentId) return;

    const loaded = noteDoc.value ?? (await noteStore.getOne(currentId));
    if (!loaded) {
      toast.error('Nota non trovata.');
      await router.replace({ name: 'notes' });
      return;
    }

    form.title = loaded.title;
    form.content = loaded.content;
    form.tag = loaded.tag ?? [];
  },
  { immediate: true }
);

function getUpdater() {
  return String(_Auth?.uid ?? 'system');
}

async function save() {
  if (isSaving.value) return;
  const title = form.title.trim();

  isSaving.value = true;

  try {
    if (isCreate.value) {
      const created = await noteStore.add({
        title,
        content: form.content,
        tag: form.tag,
        updateBy: getUpdater(),
      });
      await tagStore.upsert(form.tag, getUpdater());
      toast.success('Nota creata.');
      await router.replace({ name: 'note-edit', params: { noteId: created.id } });
      return;
    }

    if (!noteDoc.value) return;

    await noteDoc.value.update({
      title,
      content: form.content,
      tag: form.tag,
      updateBy: getUpdater(),
    });
    await tagStore.upsert(form.tag, getUpdater());
    toast.success('Nota salvata.');
  } catch (error) {
    toast.error(readErrorMessage(error));
  } finally {
    isSaving.value = false;
  }
}

async function moveToTrash() {
  if (!noteDoc.value || noteDoc.value.isDeleted) return;

  await noteDoc.value.softDelete();
  toast.success('Nota spostata nel cestino.');
  await router.push({ name: 'notes' });
}

function readErrorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message?: unknown }).message ?? 'Errore non gestito.');
  }
  return 'Errore non gestito.';
}

useHeaderExtra(NoteEditorHeaderExtra, {
  onSave: save,
  onDelete: moveToTrash,
  isSaving: () => isSaving.value,
  canDelete: () => !isCreate.value && Boolean(noteDoc.value) && !noteDoc.value?.isDeleted,
});
</script>

<template>
  <div class="container pb-t overflow-auto h-100">
    <div class="editor-form d-flex flex-column mt-1">
      <input
        v-model="form.title"
        class="input-like-h4"
        type="text"
        maxlength="180"
        autocomplete="off"
        :placeholder="titlePlaceholder"
      />

      <FieldColorTag
        name="note_tags"
        v-model="form.tag"
        class="note-tags"
        :suggestions="tagsSuggestions"
        placeholder="Importante, lavoro, personale..."
      />

      <div class="editor-content">
        <FieldTiptap
          name="note_content"
          v-model="form.content"
          placeholder="Scrivi la tua nota..."
          :toolbar-sticky-on="'top'"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.editor-form {
  gap: 0.7rem;
}

.input-like-h4 {
  font-size: 1.45rem;
  font-weight: 500;
  line-height: 1.2;
  border: none;
  outline: none;
  width: 100%;
  background-color: transparent;
  padding: 0;
}

.input-like-h4::placeholder {
  color: var(--bs-secondary-color, #6c757d);
  opacity: 0.85;
}

.note-tags :deep(.form-control) {
  min-height: 36px;
  padding-top: 0.15rem;
  padding-bottom: 0.15rem;
}

.editor-content {
  min-height: 42vh;
}

.editor-content :deep(.field-tiptap__toolbar) {
  padding: 0.15rem;
}

.editor-content :deep(.field-tiptap__editor .ProseMirror) {
  min-height: 34vh;
}
</style>
