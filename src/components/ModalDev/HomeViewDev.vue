<script setup lang="ts">
import { LocalStorageKey } from '@shared/enums/LocalStorageKey';
import { store } from '../../stores/store';
import BtnCmp from '../Btn/BtnCmp.vue';
import { LS } from '../localStorage/LS';
import rawPkg from '../../../package.json'
import { appConfigStore } from '../../stores/appConfigStore';
import { computed } from 'vue';

const appConfig = computed(() => appConfigStore.items?.[pkg?.name ?? ''])
const pkg = rawPkg as { name?: string; version?: string }
</script>

<template>
  <div class="container py-4">
    <div class="row">
      <div class="col-12 mb-3">
        <h1>Home Dev </h1>
        <p>test</p>
      </div>
      <div class="col-12 mb-4">
        <div
          class="form-check form-switch ps-0 d-flex flex-row align-items-center gap-2 justify-content-between border-bottom">
          <label class="form-check-label mb-0" for="checkDebugMod">
            {{ store.debugMod ? 'Debug mode' : 'Debug mode' }}
          </label>
          <input class="form-check-input m-0" type="checkbox" role="switch" id="checkDebugMod" v-model="store.debugMod"
            @change="() => LS.set(LocalStorageKey.storeDebugMod, store.debugMod)">
        </div>
      </div>

      <div class="col-12 mb-4" v-if="pkg.name && pkg.version && appConfig?.lastVersion !== pkg.version">
        <div
          class="form-check form-switch ps-0 d-flex flex-row align-items-center gap-2 justify-content-between border-bottom">
          <label class="form-check-label mb-0" for="checkDebugMod">
            Forza aggiornamento
          </label>

          <BtnCmp icon="sync_arrow_up" size="sm" color="light" @click="() => appConfig?.setLastVersion()"
            style="background-color:rgba(223, 113, 255) !important; border-color:rgba(223, 113, 255) !important;" />
        </div>
      </div>

      <div class="col-12 mb-4">
        <div
          class="form-check form-switch ps-0 d-flex flex-row align-items-center gap-2 justify-content-between border-bottom">
          <label class="form-check-label mb-0" for="checkDebugMod">
            Clean localStorage
          </label>
          <BtnCmp icon="delete" size="sm" @click="() => LS.clearAll()" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
