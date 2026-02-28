<script setup lang="ts">
import { _Auth, toast, useChangeHeader } from 'cic-kit';
import { computed, onMounted, reactive } from 'vue';
import AppCard from '../../components/ui/AppCard.vue';
import {
  APP_CONFIG_DEFAULTS,
  type AppConfig,
} from '../../models/AppConfig';
import { appConfigStore } from '../../stores/appConfigStore';

useChangeHeader('App Config', { name: 'home' });

const form = reactive({
  appName: APP_CONFIG_DEFAULTS.appName,
  supportEmail: APP_CONFIG_DEFAULTS.supportEmail,
  githubOrg: APP_CONFIG_DEFAULTS.githubOrg,
});

const appConfigDoc = computed(() => appConfigStore.getConfig())

onMounted(async () => {
  if (appConfigDoc.value) loadForm(appConfigDoc.value);
});

function loadForm(config: AppConfig) {
  form.appName = config.appName;
  form.supportEmail = config.supportEmail;
  form.githubOrg = config.githubOrg;
}

function getUpdater() {
  return String(_Auth?.uid ?? 'system');
}

async function save() {
  if (!appConfigDoc.value) return;

  await appConfigDoc.value.update({
    appName: form.appName.trim() || APP_CONFIG_DEFAULTS.appName,
    supportEmail: form.supportEmail.trim() || APP_CONFIG_DEFAULTS.supportEmail,
    githubOrg: form.githubOrg.trim() || APP_CONFIG_DEFAULTS.githubOrg,
  });

  toast.success(`App config aggiornata da ${getUpdater()}.`);
}
</script>

<template>
  <div class="container pb-t overflow-auto h-100">
    <AppCard class="p-3">
      <h1 class="h5 mb-3">Configurazione applicazione</h1>

      <div class="row g-2 mb-2">
        <div class="col-12 col-md-6">
          <label class="form-label small">App Name</label>
          <input v-model="form.appName" class="form-control" />
        </div>
        <div class="col-12 col-md-6">
          <label class="form-label small">Support Email</label>
          <input v-model="form.supportEmail" class="form-control" />
        </div>
      </div>

      <div class="row g-2 mb-3">
        <div class="col-12 col-md-6">
          <label class="form-label small">GitHub Org</label>
          <input v-model="form.githubOrg" class="form-control" />
        </div>
      </div>

      <button class="btn btn-primary" @click="save">Salva</button>
    </AppCard>
  </div>
</template>
