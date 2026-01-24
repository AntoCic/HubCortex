<script setup lang="ts">
import type { AnyFirestoreStoreReactive } from '@src/components/firestore/FirestoreStore';
import BtnCmp from '../../Btn/BtnCmp.vue';
import ObjectDataViewer from './ObjectDataViewer.vue';

const { store } = defineProps<{ store: AnyFirestoreStoreReactive }>()

</script>

<template>
  <div class="container py-4 sync-dev">
    <div class="row align-items-center mb-3">
      <div class="col-12">
        <h1 class="h3 mb-0">{{ store.name }}</h1>
        <p>live: <BtnCmp icon="sync" @click="() => console.log(store)" variant="outline" size="sm">
            {{ store.live ? '🟢' : '🔴' }}
          </BtnCmp>
        </p>

      </div>
      <div class="col-12">
        <ObjectDataViewer :obj="store.items" />
      </div>

    </div>
  </div>
</template>

<style scoped lang="scss"></style>
