<script setup lang="ts">
import { computed } from 'vue'
import { currentUserStore } from '@src/stores/currentUserStore';
import { UserPermission } from '@shared/enums/UserPermission';
import HomePublicView from './HomePublicView.vue';

// useStoreWatch([{ store: tournamentsStore, getOpts: { ids, forceLocalSet: true }, getAuthOpts: { forceLocalSet: true } }], false);

const hasUserP = (permission: UserPermission) => currentUserStore.user?.hasPermission(permission) ?? false
const isAdmin = computed(() => hasUserP(UserPermission.SUPERADMIN) || hasUserP(UserPermission.ADMIN))
const userName = computed(() => currentUserStore.user?.name || 'Utente');
</script>

<template>
  <!-- HOME da non loggato -->
  <HomePublicView v-if="!currentUserStore.isLoggedIn" />

  <!-- HOME loggato -->
  <template v-else>
    <div class="container overflow-auto h-100 pb-t">

      <div class="row my-4">
        <div class="col-12">
          <div
            class="bg-white p-4 rounded-3 shadow-sm border-start border-primary border-5 d-flex justify-content-between align-items-center">
            <div>
              <h2 class="fw-bold mb-1">Ciao, {{ userName }}! 👋</h2>
              <p class="text-muted mb-0">Ecco cosa sta succedendo oggi nella tua dashboard.</p>
            </div>
            <div class="d-none d-md-block">
              <span class="badge bg-primary rounded-pill px-3 py-2">Membro</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="isAdmin" class="row mb-4 animate-fade-in">
        <div class="col-12">
          <div class="card border-danger shadow-sm">
            <div class="card-header bg-danger text-white fw-bold d-flex align-items-center">
              <i class="bi bi-shield-lock-fill me-2"></i> Area Amministrazione
            </div>
          </div>
        </div>
      </div>

      <div class="row g-4">
        <div class="col-md-6 col-lg-4">
          <div class="card h-100 border-0 shadow-sm hover-card">
            <div class="card-body text-center py-5">
              <div class="icon-bg bg-primary-subtle text-primary mb-3 rounded-circle d-inline-flex p-3">
                <i class="bi bi-activity fs-4"></i>
              </div>
              <h5 class="card-title">Attività Recenti</h5>
              <p class="card-text text-muted small">Nessuna nuova attività da segnalare al momento.</p>
            </div>
          </div>
        </div>

        <div class="col-md-6 col-lg-4">
          <div class="card h-100 border-0 shadow-sm hover-card">
            <div class="card-body text-center py-5">
              <div class="icon-bg bg-success-subtle text-success mb-3 rounded-circle d-inline-flex p-3">
                <i class="bi bi-person-lines-fill fs-4"></i>
              </div>
              <h5 class="card-title">Il mio Profilo</h5>
              <p class="card-text text-muted small">Aggiorna i tuoi dati e le preferenze.</p>
            </div>
          </div>
        </div>

        <div class="col-md-12 col-lg-4">
          <div class="card h-100 border-0 shadow-sm hover-card bg-primary text-white">
            <div class="card-body d-flex flex-column justify-content-center align-items-center text-center py-5">
              <h5 class="card-title">Nuovo Progetto?</h5>
              <p class="card-text small opacity-75">Inizia subito a lavorare su qualcosa di nuovo.</p>
              <button class="btn btn-light btn-sm fw-bold mt-2">Crea +</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
</template>

<style lang="scss" scoped>
.dashboard-container {
  // Un grigio molto chiaro per staccare dal bianco delle card
  background-color: #f8f9fa;
}

.hover-card {
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 .5rem 1rem rgba(0, 0, 0, .15) !important;
  }
}

// Animazione semplice per l'apparizione
.animate-fade-in {
  animation: fadeIn 0.5s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.icon-bg {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
