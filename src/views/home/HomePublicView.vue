<script setup lang="ts">
import BtnCmp from '@src/components/Btn/BtnCmp.vue';
</script>

<template>
  <div class="container overflow-auto h-100 pb-t">
    <div class="hero-section d-flex align-items-center text-center text-lg-start">
      <div class="container">
        <div class="row align-items-center">
          <div class="col-lg-6 mb-5 mb-lg-0">
            <h1 class="display-4 fw-bold mb-3 text-dark">
              Benvenuto nella tua Web App
            </h1>
            <p class="lead text-muted mb-4">
              Gestisci i tuoi progetti, monitora i progressi e collabora con il tuo team in un'unica piattaforma
              intuitiva e veloce.
            </p>
            <div class="d-grid gap-2 d-md-flex justify-content-lg-start justify-content-center">
              <BtnCmp class="px-4 py-2 shadow-sm" icon="login" :to="{ name: 'login', query: { redirect: '/' } }"
                size="lg">
                Accedi ora
              </BtnCmp>
              <button class="btn btn-outline-secondary btn-lg px-4">Scopri di più</button>
            </div>
          </div>

          <div class="col-lg-6 text-center">
            <div class="hero-image-placeholder shadow-lg rounded-3">
              <i class="bi bi-laptop fs-1 text-white"></i>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="container py-5">
      <div class="row g-4 text-center">
        <div class="col-md-4">
          <div class="p-3 border rounded-3 bg-white h-100 shadow-sm feature-card">
            <h3 class="h5 mt-3">Veloce</h3>
            <p class="text-muted small">Ottimizzato per le prestazioni.</p>
          </div>
        </div>
        <div class="col-md-4">
          <div class="p-3 border rounded-3 bg-white h-100 shadow-sm feature-card">
            <h3 class="h5 mt-3">Sicuro</h3>
            <p class="text-muted small">I tuoi dati sono protetti.</p>
          </div>
        </div>
        <div class="col-md-4">
          <div class="p-3 border rounded-3 bg-white h-100 shadow-sm feature-card">
            <h3 class="h5 mt-3">Intuitivo</h3>
            <p class="text-muted small">Facile da usare per tutti.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.hero-section {
  padding: 4rem 0;
}

.hero-image-placeholder {
  // Placeholder visivo se non hai un'immagine vettoriale
  background: linear-gradient(45deg, #D5D5D5, #6F6F6F);
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.9;
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.02);
  }
}

.feature-card {
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-5px);
  }
}
</style>