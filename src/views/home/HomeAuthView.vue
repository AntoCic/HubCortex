<script setup lang="ts">
import { useChangeHeader } from 'cic-kit';
import { computed, onMounted } from 'vue';
import { projectStatusStore } from '../../stores/projectStatusStore';
import { projectStore } from '../../stores/projectStore';
import { projectTaskStore } from '../../stores/projectTaskStore';

useChangeHeader('Home Auth', { name: 'home' });

const projectCount = computed(() => projectStore.itemsActiveArray.length);
const taskCount = computed(() => projectTaskStore.itemsActiveArray.length);
const errorCount = computed(
  () => projectStatusStore.itemsActiveArray.filter((item) => item.level === 'error').length,
);

onMounted(async () => {
  await Promise.all([projectStore.get(), projectTaskStore.get(), projectStatusStore.get()]);
});
</script>

<template>
  <div class="container page-wrap">
    <div class="row g-3">
      <div class="col-12 col-md-4">
        <div class="card card-hub p-3">
          <div class="text-secondary small">Progetti attivi</div>
          <div class="fs-3 fw-bold text-brand-blue">{{ projectCount }}</div>
        </div>
      </div>
      <div class="col-12 col-md-4">
        <div class="card card-hub p-3">
          <div class="text-secondary small">Task</div>
          <div class="fs-3 fw-bold text-brand-blue">{{ taskCount }}</div>
        </div>
      </div>
      <div class="col-12 col-md-4">
        <div class="card card-hub p-3">
          <div class="text-secondary small">Errori progetto</div>
          <div class="fs-3 fw-bold text-brand-red">{{ errorCount }}</div>
        </div>
      </div>
    </div>

    <div class="mt-4">
      <RouterLink :to="{ name: 'projects' }" class="btn btn-hub-primary">Apri Gestione Progetti</RouterLink>
    </div>
  </div>
</template>
