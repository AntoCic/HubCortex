<script setup lang="ts">
import { RouterView } from 'vue-router';
import HeaderApp from './layout/HeaderApp.vue'
import FooterApp from './layout/FooterApp.vue'
import { onBeforeMount, onMounted } from 'vue';
import { loading } from './components/loading/loadingController';
import LoaderCmp from './components/loading/LoaderCmp.vue';
import { currentUserStore } from './stores/currentUserStore';
import ToastCmp from './components/toast/ToastCmp.vue';
import ModalDev from './components/ModalDev/ModalDev.vue';
import { store } from './stores/store';
import RegisterSW from './components/RegisterSW.vue';
import { appConfigStore } from './stores/appConfigStore';
import { toast } from './components/toast/toastController';
import { LS } from './components/localStorage/LS';
import { User } from './models/User';
import { LocalStorageKey, LS_keyModel, type LSkeyModel } from '@shared/enums/LocalStorageKey';
import { UserPermission } from '@shared/enums/UserPermission';

onMounted(() => {
  document.getElementsByClassName('starter-loader')?.[0]?.remove();
})
onBeforeMount(() => {
  // --------------------------------------------------------------
  // -------------- SET DATA FROM LOCALSTORAGE --------------------
  try {
    const docs = LS.getParsed(LocalStorageKey.currentUser)
    if (docs) {
      const uids = Object.keys(docs);
      if (uids.length > 1) {
        LS.delete(LocalStorageKey.currentUser);
      } else if (uids.length === 1) {
        if (currentUserStore.checkLastLogin()) {
          currentUserStore.logout()
        } else {
          currentUserStore.user = new User(docs[uids[0]!])
        }
      } else {
        currentUserStore.logout()
      }
    }
  } catch (error) {
    toast.error('Error localGet user')
  }

  for (const key of Object.values(LS_keyModel)) {
    switch (key) {
      case 'appConfig' as LSkeyModel:
        appConfigStore.localGet();
        break;
    }
  }


})

</script>

<template>
  <LoaderCmp v-if="currentUserStore.isLoginChecked ? loading.state : false" />
  <ToastCmp />
  <template v-if="currentUserStore.isLoginChecked">
    <HeaderApp />
    <main>
      <RouterView />
    </main>
    <FooterApp />
  </template>
  <ModalDev v-if="currentUserStore.user?.hasPermission(UserPermission.MODAL_DEV_ON) && store.debugMod" />
  <RegisterSW />
</template>

<style scoped lang="scss">
/*
@use './style/partials/_variables.scss' as *;
@use '../style/partials/_variables.scss' as *;
*/
</style>
