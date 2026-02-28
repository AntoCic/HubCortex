<script setup lang="ts">
import { useChangeHeader } from 'cic-kit';
import { onMounted } from 'vue';
import { publicUserStore } from '../../stores/publicUser';

useChangeHeader('Public Users', { name: 'home-auth' });

onMounted(async () => {
  await publicUserStore.get();
});
</script>

<template>
  <div class="container page-wrap">
    <div class="card card-hub p-3">
      <h1 class="h5 mb-3">Utenti Pubblici</h1>

      <div v-if="!publicUserStore.itemsActiveArray.length" class="text-secondary">Nessun utente pubblico.</div>

      <div v-else class="list-group">
        <div class="list-group-item" v-for="user in publicUserStore.itemsActiveArray" :key="user.id">
          <div class="fw-semibold">{{ user.fullName || user.id }}</div>
          <div class="small text-secondary">{{ user.id }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
