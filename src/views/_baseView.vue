<script setup lang="ts">
import { useChangeHeader } from 'cic-kit';

useChangeHeader('title', { name: 'home' });
</script>

<template>
  <div class="container page-wrap">
    <div class="card card-hub p-4">
      <p class="mb-0 text-secondary">Base view template.</p>
    </div>
  </div>
</template>
