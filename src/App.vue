<script setup lang="ts">
import {
  HeaderApp,
  LoaderCmp,
  ModalDev,
  RegisterSW,
  ToastCmp,
  ToolbarApp,
  _Auth,
  cicKitStore,
  defaultUserPermission,
  loading,
  toolbarOffcanvasStore,
  useStoreWatch,
} from 'cic-kit';
import { computed, onMounted, watchEffect } from 'vue';
import { registerSW } from 'virtual:pwa-register';
import { getToolbarOffcanvasTabs } from './toolbarMenu';
import { Auth } from './main';
import { publicUserStore } from './stores/publicUser';
import { UserPermission } from '@shared/enums/UserPermission';
import { appConfigStore } from './stores/appConfigStore';
useStoreWatch([{ store: appConfigStore, checkLogin: false }, { store: publicUserStore }]);

const isLoggedIn = computed(() => Boolean(_Auth?.isLoggedIn));
const permissions = computed(() => _Auth?.user?.permissions ?? []);
const userPermission = computed(() => Object.values(UserPermission));
const isPreviewHostingChannel = computed(() => {
  if (typeof window === 'undefined') return false;
  const host = String(window.location.hostname ?? '').toLowerCase();
  return host.endsWith('.web.app') && host.includes('--');
});

watchEffect(() => {
  toolbarOffcanvasStore.setTabs(getToolbarOffcanvasTabs(isLoggedIn.value, permissions.value));
});
onMounted(() => {
  document.getElementsByClassName('starter-loader')?.[0]?.remove();

  if (!isPreviewHostingChannel.value) return;

  // In preview channels force a clean runtime to avoid stale SW/cache across branch deploys.
  if ('serviceWorker' in navigator) {
    void navigator.serviceWorker.getRegistrations().then(async (registrations) => {
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }).catch(() => undefined);
  }

  if ('caches' in window) {
    void caches.keys().then(async (keys) => {
      await Promise.all(keys.map((key) => caches.delete(key)));
    }).catch(() => undefined);
  }
})
</script>

<template>
  <LoaderCmp v-if="loading.state" />
  <HeaderApp />

  <main>
    <RouterView />
  </main>

  <ToolbarApp glass primary-dark="#F05454" primary-light="#30475E"/>
  <ModalDev v-if="Auth?.user?.hasPermission(defaultUserPermission.MODAL_DEV_ON) && cicKitStore.debugMod"
    :public-users="publicUserStore.items" :user_permissions="userPermission" />
  <ToastCmp />
  <RegisterSW v-if="!isPreviewHostingChannel" :register-s-w="registerSW" />
</template>
