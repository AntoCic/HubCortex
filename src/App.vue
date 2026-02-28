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

watchEffect(() => {
  toolbarOffcanvasStore.setTabs(getToolbarOffcanvasTabs(isLoggedIn.value, permissions.value));
});
onMounted(() => {
  document.getElementsByClassName('starter-loader')?.[0]?.remove();
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
  <RegisterSW :register-s-w="registerSW" />
</template>
