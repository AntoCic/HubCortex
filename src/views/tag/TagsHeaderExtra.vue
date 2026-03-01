<script setup lang="ts">
import { Btn } from 'cic-kit';

type Emits = {
  (e: 'create'): void;
};

const emit = defineEmits<Emits>();
</script>

<template>
  <Btn type="button" variant="ghost" icon="add" tooltip="Nuova tag" @click="emit('create')" />
</template>
