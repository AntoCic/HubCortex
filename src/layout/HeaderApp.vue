<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router';
import { store } from '../stores/store';
import { currentUserStore } from '../stores/currentUserStore';
import BtnCmp from '../components/Btn/BtnCmp.vue';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import LogoHeader from '../components/Logo/LogoHeader.vue';
import { setToolbarTab } from '../components/toolbar/useChangeToolbar';

const route = useRoute();

const isLoginRoute = computed(() => route.name === 'user');
const isHomeRoute = computed(() => route.name === 'home');

const headerRef = ref<HTMLElement | null>(null)
let ro: ResizeObserver | null = null

onMounted(() => {
  const el = headerRef.value
  if (!el) return
  const setVar = () => {
    store.HEADER.height = el.offsetHeight;
    return document.documentElement.style.setProperty('--header-h', `${el.offsetHeight}px`)
  }
  ro = new ResizeObserver(setVar)
  ro.observe(el)
  setVar()
})

onBeforeUnmount(() => {
  ro?.disconnect()
  ro = null
})

</script>

<template>
  <header v-if="store.HEADER.show" ref="headerRef">
    <div class="container">
      <nav class="row align-items-center my-1">
        <div class="col-auto">
          <LogoHeader :loading="store.HEADER.loading" :back-to="store.HEADER.backTo" />
        </div>
        <div class="col">
          <h1 class="mb-0 f-calSans" v-if="(store.HEADER.title + store.HEADER.defaultTitle).trim() !== ''"> {{
            store.HEADER.title !== '' ? store.HEADER.title : store.HEADER.defaultTitle }} </h1>
        </div>
        <div class="col-auto p-0">
          <component v-if="store.HEADER.extra" :is="store.HEADER.extra" v-bind="store.HEADER.extraProps" />
        </div>
        <div class="col-auto" v-if="store.HEADER.userBtn">
          <template v-if="currentUserStore.isLoggedIn">
            <BtnCmp v-if="isLoginRoute" color="danger" variant="outline" @click="() => currentUserStore.logout()"
              icon="logout" class="p-2" />
            <RouterLink v-if="isHomeRoute" :to="{ name: 'user' }" @click="() => setToolbarTab('hidden')">
              <img :src="currentUserStore.user?.photoURL ?? ''" alt="User Photo" class="logo-shadows rounded-circle"
                width="40">
            </RouterLink>
          </template>

          <RouterLink :to="{ name: 'login', query: { redirect: '/user' } }" v-else>
            <button class="btn btn-outline-dark border-0 px-1 me-1">
              <span class="material-symbols-outlined">
                account_circle
              </span>
            </button>
          </RouterLink>
        </div>
      </nav>
    </div>
  </header>
</template>

<style lang="scss" scoped></style>
