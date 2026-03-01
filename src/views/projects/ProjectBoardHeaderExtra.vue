<script setup lang="ts">
import { Btn } from 'cic-kit';

type Emits = {
  (e: 'openSettings'): void;
};

const emit = defineEmits<Emits>();
</script>

<template>
  <Btn type="button" variant="ghost" icon="settings" tooltip="Layout colonne" @click="emit('openSettings')" />
</template>
