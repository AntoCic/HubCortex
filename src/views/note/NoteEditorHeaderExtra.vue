<script setup lang="ts">
import { Btn } from 'cic-kit';
import { computed } from 'vue';

type HeaderFn = (() => unknown) | undefined;

const props = defineProps<{
  onSave?: HeaderFn;
  onDelete?: HeaderFn;
  isSaving?: () => boolean;
  canDelete?: () => boolean;
}>();

const saving = computed(() => props.isSaving?.() ?? false);
const showDelete = computed(() => props.canDelete?.() ?? false);
</script>

<template>
  <div class="d-flex align-items-center gap-1">
    <Btn
      v-if="showDelete"
      variant="ghost"
      color="danger"
      icon="delete"
      tooltip="Sposta nel cestino"
      :disabled="saving"
      @click="props.onDelete?.()"
    />
    <Btn
      variant="solid"
      color="primary"
      icon="save"
      tooltip="Salva nota"
      :disabled="saving"
      :loading="saving"
      @click="props.onSave?.()"
    />
  </div>
</template>
