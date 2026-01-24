<script setup lang="ts">
import { currentUserStore } from '../../stores/currentUserStore'
import { useChangeHeader } from '../../components/header/useChangeHeader';
import { store } from '../../stores/store';
import PwaUpdateButton from '../../components/Btn/PwaUpdateButton.vue';
import BtnCmp from '../../components/Btn/BtnCmp.vue';
import { pushMsg } from '../../components/notification/pushMsg';
import { RouterLink } from 'vue-router';
import { LocalStorageKey } from '@shared/enums/LocalStorageKey';
import { LS } from '../../components/localStorage/LS';
import pkg from '../../../package.json'

useChangeHeader('Utente', { name: "home" });
</script>

<template>
  <div class="container pt-4 pb-t overflow-auto h-100">
    <div class="row justify-content-center">

      <!-- SEZIONE UTENTE -->
      <div class="col-12 col-md-10 col-lg-8 mb-4">
        <template v-if="currentUserStore.user?.hasPermission('SUPERADMIN')">
          <div
            class="form-check form-switch ps-0 d-flex flex-row align-items-center gap-2 justify-content-between border-bottom mb-3">
            <label class="form-check-label mb-0" for="checkDebugMod">
              {{ store.debugMod ? 'Debug mode' : 'Debug mode' }}
            </label>
            <input class="form-check-input m-0" type="checkbox" role="switch" id="checkDebugMod"
              v-model="store.debugMod" @change="() => LS.set(LocalStorageKey.storeDebugMod, store.debugMod)">
          </div>
        </template>

        <RouterLink :to="{ name: 'user-info' }" class="text-decoration-none">
          <div class="card user-card align-items-center p-3 d-flex flex-row justify-content-between shadow-sm">
            <div class="d-flex align-items-center">
              <img v-if="currentUserStore.user?.photoURL" :src="currentUserStore.user?.photoURL ?? ''" alt="User Photo"
                class="rounded-circle me-3 border border-light-subtle shadow-sm" width="60" height="60">
              <div>
                <h5 class="mb-0 fw-semibold text-dark">{{ currentUserStore.user?.fullName }}</h5>
                <small class="text-muted">{{ currentUserStore.user?.email }}</small>
              </div>
            </div>
            <span class="material-symbols-outlined arrow">
              arrow_forward_ios
            </span>
          </div>
        </RouterLink>
      </div>
      <!-- SEZIONE AZIONI -->
      <div class="col-12 col-md-10 col-lg-8 mb-4">
        <h6 class="text-uppercase text-secondary fw-bold small mb-3">Impostazioni</h6>
        <div class="d-grid gap-3">
          <BtnCmp @click="pushMsg.askPermission" block class="btn-notifica">
            🔔 Abilita notifiche
          </BtnCmp>


        </div>
      </div>

      <!-- SEZIONE AGGIORNAMENTO -->
      <div class="col-12 col-md-10 col-lg-8 text-center mt-4">
        <h6 class="text-uppercase text-secondary fw-bold small mb-3">Aggiornamento App</h6>
        <PwaUpdateButton class="mx-auto" />
        <p class="text-secondary mt-2">versione attuale: {{ pkg.version }}</p>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.user-card {
  transition: all 0.25s ease;
  border: 1px solid #eee;
  border-radius: 12px;
  background-color: #fff;
  cursor: pointer;

  &:hover {
    background-color: #f8f9fa;
    transform: translateY(-2px);
  }

  .arrow {
    font-size: 1.2rem;
    color: #888;
    transition: color 0.2s;
  }

  &:hover .arrow {
    color: #000;
  }
}

.btn-notifica {
  font-size: 1rem;
  background: linear-gradient(90deg, #ffd65c, #ff9f1a);
  color: #000;
  border: none;
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(255, 159, 26, 0.3);
  transition: all 0.2s ease;

  &:hover {
    background: linear-gradient(90deg, #ffcc00, #ff7b00);
    transform: translateY(-1px);
  }
}
</style>
