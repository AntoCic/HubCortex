<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

onMounted(() => {
  router.replace({ name: 'project-dashboard' });
});
</script>

<template>
  <div class="container pb-t overflow-auto h-100">
    <div class="text-secondary">Reindirizzamento alla dashboard progetti...</div>
  </div>
</template>
