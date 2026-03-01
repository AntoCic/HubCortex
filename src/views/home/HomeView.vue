<script setup lang="ts">
import { Btn, _Auth, useChangeHeader } from 'cic-kit';
import { computed } from 'vue';
import AppCard from '../../components/ui/AppCard.vue';
import HomeAuthView from './HomeAuthView.vue';

useChangeHeader('HubCortex', { name: 'home' });

const projectRoute = computed(() => (_Auth?.isLoggedIn ? { name: 'project-dashboard' } : { name: 'login' }));
const isLoggedIn = computed(() => Boolean(_Auth?.isLoggedIn));
</script>

<template>
  <div class="container pb-t overflow-auto h-100">
    <HomeAuthView v-if="isLoggedIn" />
    <div v-else class="row justify-content-center">
      <div class="col-12 col-lg-8">
        <AppCard class="p-4 p-md-5 text-center">
          <img src="/img/logo/logo.png" alt="HubCortex" class="mx-auto mb-4" style="max-width: 180px" />
          <h1 class="h3 fw-bold text-primary">Gestione Progetti AI</h1>
          <p class="text-secondary mb-4"> 
            Struttura base pronta per progetti, task, stati e messaggi di errore.
          </p>

          <RouterLink :to="projectRoute" class="text-decoration-none">
            <Btn class="btn btn-primary px-4">Vai alla gestione progetti</Btn>
          </RouterLink>
        </AppCard>
      </div>
    </div>
  </div>
</template>
