<script setup lang="ts">
import { Btn, _Auth, useChangeHeader } from 'cic-kit';
import { computed } from 'vue';

useChangeHeader('HubCortex', { name: 'home' });

const projectRoute = computed(() => (_Auth?.isLoggedIn ? { name: 'projects' } : { name: 'login' }));
</script>

<template>
  <div class="container page-wrap">
    <div class="row justify-content-center">
      <div class="col-12 col-lg-8">
        <div class="card card-hub p-4 p-md-5 text-center">
          <img src="/img/logo/logo.png" alt="HubCortex" class="mx-auto mb-4" style="max-width: 180px" />
          <h1 class="h3 fw-bold text-brand-blue">Gestione Progetti AI</h1>
          <p class="text-secondary mb-4">
            Struttura base pronta per progetti, task, stati e messaggi di errore.
          </p>

          <RouterLink :to="projectRoute" class="text-decoration-none">
            <Btn class="btn btn-hub-primary px-4">Vai alla gestione progetti</Btn>
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>
