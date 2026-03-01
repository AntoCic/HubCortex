<script setup lang="ts">
import { Btn } from 'cic-kit';
import { computed } from 'vue';

type Emits = {
  (e: 'create'): void;
};

const props = defineProps<{
  canCreate?: () => boolean;
}>();

const emit = defineEmits<Emits>();
const showCreate = computed(() => props.canCreate?.() ?? true);
</script>

<template>
  <Btn v-if="showCreate" type="button" variant="ghost" icon="add" tooltip="Nuovo progetto" @click="emit('create')" />
</template>
