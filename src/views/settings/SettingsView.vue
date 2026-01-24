<script setup lang="ts">
import { useChangeHeader } from '../../components/header/useChangeHeader';

useChangeHeader('Settings', { name: 'home' });
</script>

<template>
  <div class="container py-4 overflow-auto h-100">
    <div class="row justify-content-center">
      <div class="col-12 col-md-10 col-lg-8 mb-4">

        <div class="text-center text-muted">
          <h5 class="mb-2">Impostazioni</h5>
          <p class="mb-0">
            Questa sezione è già predisposta nell’architettura dell’applicazione,
            ma al momento non contiene funzionalità attive.
          </p>
          <p class="small">
            In futuro ospiterà le impostazioni dell’utente, configurazioni avanzate
            e opzioni legate al profilo e all’esperienza d’uso.
          </p>
        </div>

      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>