<script setup lang="ts">
import {
  _Auth,
  Btn,
  COLOR_TAG_DEFAULT_COLOR,
  Modal,
  toast,
  useChangeHeader,
  useHeaderExtra,
  useStoreWatch,
} from 'cic-kit';
import { computed, reactive, ref } from 'vue';
import AppCard from '../../components/ui/AppCard.vue';
import { buildTagId, createTagData } from '../../models/Tag';
import { tagStore } from '../../stores/tagStore';
import TagsHeaderExtra from './TagsHeaderExtra.vue';

useChangeHeader('Tag', { name: 'home' });
useStoreWatch([{ store: tagStore }]);

const search = ref('');
const isSaving = ref(false);

const tagModal = reactive({
  open: false,
  mode: 'create' as 'create' | 'edit',
  tagId: '',
  label: '',
  color: COLOR_TAG_DEFAULT_COLOR,
});

const tags = computed(() => {
  const query = search.value.trim().toLowerCase();
  const list = [...tagStore.itemsActiveArray].sort((a, b) => a.tag.label.localeCompare(b.tag.label));
  if (!query) return list;
  return list.filter((item) => item.tag.label.toLowerCase().includes(query));
});

const selectedTagDoc = computed(() => (tagModal.tagId ? tagStore.items?.[tagModal.tagId] : undefined));

function openCreateTag() {
  tagModal.open = true;
  tagModal.mode = 'create';
  tagModal.tagId = '';
  tagModal.label = '';
  tagModal.color = COLOR_TAG_DEFAULT_COLOR;
}

function openEditTag(tagId: string) {
  const doc = tagStore.items?.[tagId];
  if (!doc) return;

  tagModal.open = true;
  tagModal.mode = 'edit';
  tagModal.tagId = doc.id;
  tagModal.label = doc.tag.label;
  tagModal.color = doc.tag.color;
}

function closeModal() {
  tagModal.open = false;
}

async function saveTag() {
  const label = tagModal.label.trim();
  const color = normalizeColor(tagModal.color);
  if (!label) {
    toast.warning('Inserisci il nome tag.');
    return;
  }

  isSaving.value = true;
  try {
    if (tagModal.mode === 'create') {
      const existing = tagStore.findByLabel(label);
      if (existing) {
        await existing.update({ tag: { label, color }, updateBy: getUpdater() });
        toast.success('Tag aggiornata.');
      } else {
        await tagStore.add(createTagData({ label, color }, getUpdater()));
        toast.success('Tag creata.');
      }
      closeModal();
      return;
    }

    if (!selectedTagDoc.value) return;

    const nextId = buildTagId(label);
    const currentId = selectedTagDoc.value.id;
    const existingById = tagStore.items?.[nextId];

    if (nextId !== currentId && existingById) {
      toast.warning('Esiste gia una tag con questo nome.');
      return;
    }

    if (nextId === currentId) {
      await selectedTagDoc.value.update({
        tag: { label, color },
        updateBy: getUpdater(),
      });
    } else {
      await tagStore.add({
        id: nextId,
        tag: { label, color },
        updateBy: getUpdater(),
      });
      await tagStore.delete(currentId);
    }

    toast.success('Tag aggiornata.');
    closeModal();
  } catch (error) {
    toast.error(readErrorMessage(error));
  } finally {
    isSaving.value = false;
  }
}

async function deleteTag(tagId: string) {
  const doc = tagStore.items?.[tagId];
  if (!doc) return;

  const confirmed = window.confirm(`Eliminare la tag "${doc.tag.label}"?`);
  if (!confirmed) return;

  await tagStore.delete(tagId);
  toast.success('Tag eliminata.');
}

function normalizeColor(value: string) {
  const color = String(value ?? '').trim();
  if (/^#[0-9a-fA-F]{6}$/.test(color)) return color;
  return COLOR_TAG_DEFAULT_COLOR;
}

function getUpdater() {
  return String(_Auth?.uid ?? 'system');
}

function readErrorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message?: unknown }).message ?? 'Errore non gestito.');
  }
  return 'Errore non gestito.';
}

useHeaderExtra(TagsHeaderExtra, { onCreate: openCreateTag });
</script>

<template>
  <div class="container pb-t overflow-auto h-100">
    <div class="search-bar-wrap">
      <input v-model="search" class="form-control" type="search" placeholder="Cerca tag..." />
    </div>

    <div class="row g-3">
      <div v-if="!tags.length" class="col-12 text-secondary">Nessuna tag disponibile.</div>

      <div class="col-12 col-md-6 col-xl-4" v-for="item in tags" :key="item.id">
        <AppCard class="p-3 h-100 tag-card">
          <div class="d-flex justify-content-between align-items-start gap-2">
            <div>
              <span class="badge me-2" :style="{ backgroundColor: item.tag.color }">{{ item.tag.label }}</span>
              <div class="small text-secondary mt-2">{{ item.tag.color }}</div>
            </div>
            <div class="d-flex gap-1">
              <Btn variant="ghost" color="dark" icon="edit" tooltip="Modifica" @click="openEditTag(item.id)" />
              <Btn variant="ghost" color="danger" icon="delete" tooltip="Elimina" @click="deleteTag(item.id)" />
            </div>
          </div>
        </AppCard>
      </div>
    </div>

    <Modal
      v-model="tagModal.open"
      :title="tagModal.mode === 'create' ? 'Nuova tag' : 'Modifica tag'"
      centered
      cancel-text="Chiudi"
      ok-text="Salva"
      :on-ok="saveTag"
    >
      <div class="d-flex flex-column gap-3">
        <div>
          <label class="form-label small">Nome</label>
          <input v-model="tagModal.label" class="form-control" placeholder="backend" />
        </div>

        <div class="row g-2 align-items-center">
          <div class="col-12 col-md-5">
            <label class="form-label small">Colore</label>
            <input v-model="tagModal.color" type="color" class="form-control form-control-color w-100" />
          </div>
          <div class="col-12 col-md-7">
            <label class="form-label small">Hex</label>
            <input v-model="tagModal.color" class="form-control font-monospace" placeholder="#1985a1" />
          </div>
        </div>

        <div>
          <div class="small text-secondary mb-1">Anteprima</div>
          <span class="badge" :style="{ backgroundColor: normalizeColor(tagModal.color) }">
            {{ tagModal.label.trim() || 'tag' }}
          </span>
        </div>

        <div class="small text-secondary" v-if="isSaving">Salvataggio...</div>
      </div>
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

.tag-card {
  border-top: 4px solid rgba(31, 138, 112, 0.7);
}
</style>
