<script setup lang="ts">
import { _Auth, toast, useChangeHeader } from 'cic-kit';
import { onMounted, reactive } from 'vue';
import {
  APP_CONFIG_DEFAULTS,
  APP_CONFIG_ID,
  type AppConfig,
  type AppConfigData,
} from '../../models/AppConfig';
import { appConfigStore } from '../../stores/appConfigStore';

useChangeHeader('App Config', { name: 'home-auth' });

const form = reactive({
  appName: APP_CONFIG_DEFAULTS.appName,
  supportEmail: APP_CONFIG_DEFAULTS.supportEmail,
  githubOrg: APP_CONFIG_DEFAULTS.githubOrg,
  defaultProjectStatus: APP_CONFIG_DEFAULTS.defaultProjectStatus,
});

let appConfigDoc: AppConfig | undefined;

onMounted(async () => {
  await appConfigStore.get();
  appConfigDoc = appConfigStore.items[APP_CONFIG_ID];

  if (!appConfigDoc) {
    appConfigDoc = await appConfigStore.add({
      id: APP_CONFIG_ID,
      appName: APP_CONFIG_DEFAULTS.appName,
      supportEmail: APP_CONFIG_DEFAULTS.supportEmail,
      githubOrg: APP_CONFIG_DEFAULTS.githubOrg,
      defaultProjectStatus: APP_CONFIG_DEFAULTS.defaultProjectStatus,
    } as AppConfigData);
  }

  loadForm(appConfigDoc);
});

function loadForm(config: AppConfig) {
  form.appName = config.appName;
  form.supportEmail = config.supportEmail;
  form.githubOrg = config.githubOrg;
  form.defaultProjectStatus = config.defaultProjectStatus;
}

function getUpdater() {
  return String(_Auth?.uid ?? 'system');
}

async function save() {
  if (!appConfigDoc) return;

  await appConfigDoc.update({
    appName: form.appName.trim() || APP_CONFIG_DEFAULTS.appName,
    supportEmail: form.supportEmail.trim() || APP_CONFIG_DEFAULTS.supportEmail,
    githubOrg: form.githubOrg.trim() || APP_CONFIG_DEFAULTS.githubOrg,
    defaultProjectStatus: form.defaultProjectStatus,
  });

  toast.success(`App config aggiornata da ${getUpdater()}.`);
}
</script>

<template>
  <div class="container page-wrap">
    <div class="card card-hub p-3">
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
        <div class="col-12 col-md-6">
          <label class="form-label small">Default Project Status</label>
          <select v-model="form.defaultProjectStatus" class="form-select">
            <option value="planned">planned</option>
            <option value="active">active</option>
            <option value="blocked">blocked</option>
            <option value="done">done</option>
          </select>
        </div>
      </div>

      <button class="btn btn-hub-primary" @click="save">Salva</button>
    </div>
  </div>
</template>
