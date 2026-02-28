<script setup lang="ts">
import {
  HeaderApp,
  LoaderCmp,
  RegisterSW,
  ToastCmp,
  ToolbarApp,
  _Auth,
  loading,
  toolbarOffcanvasStore,
} from 'cic-kit';
import { computed, watchEffect } from 'vue';
import { registerSW } from 'virtual:pwa-register';
import { getToolbarOffcanvasTabs } from './toolbarMenu';

const isLoggedIn = computed(() => Boolean(_Auth?.isLoggedIn));
const permissions = computed(() => _Auth?.user?.permissions ?? []);

watchEffect(() => {
  toolbarOffcanvasStore.setTabs(getToolbarOffcanvasTabs(isLoggedIn.value, permissions.value));
});
</script>

<template>
  <LoaderCmp v-if="loading.state" />
  <HeaderApp />

  <main class="app-main">
    <RouterView />
  </main>

  <ToolbarApp glass />
  <ToastCmp />
  <RegisterSW :register-s-w="registerSW" />
</template>
