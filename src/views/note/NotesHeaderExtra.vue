<script setup lang="ts">
import { Btn } from 'cic-kit';

type Emits = {
  (e: 'create'): void;
  (e: 'selectFilter', value: 'notes' | 'trash'): void;
};

const emit = defineEmits<Emits>();
</script>

<template>
  <div class="d-flex align-items-center gap-1">
    <Btn type="button" variant="ghost" icon="menu" data-bs-toggle="dropdown" aria-expanded="false" />

    <ul class="dropdown-menu dropdown-menu-end">
      <li>
        <button class="dropdown-item" type="button" @click="emit('selectFilter', 'notes')">
          Note
        </button>
      </li>
      <li>
        <button class="dropdown-item" type="button" @click="emit('selectFilter', 'trash')">
          Cestino
        </button>
      </li>
    </ul>

    <Btn type="button" variant="ghost" icon="add" tooltip="Nuova nota" @click="emit('create')" />
  </div>
</template>
