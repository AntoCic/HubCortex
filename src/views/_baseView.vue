<script setup lang="ts">
import { useChangeHeader } from 'cic-kit';
import AppCard from '../components/ui/AppCard.vue';

useChangeHeader('title', { name: 'home' });
</script>

<template>
  <div class="container pb-t overflow-auto h-100">
    <AppCard class="p-4">
      <p class="mb-0 text-secondary">Base view template.</p>
    </AppCard>
  </div>
</template>
