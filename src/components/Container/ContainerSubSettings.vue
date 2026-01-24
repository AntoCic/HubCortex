<!-- ContainerSubSettings.vue -->
<script setup lang="ts">
import { useAttrs } from 'vue';
import BtnCmp from '../Btn/BtnCmp.vue';
import { useRouter } from 'vue-router';

const attrs = useAttrs();
const router = useRouter();
const props = defineProps<{
  title?: string;
  goBack?: () => void;
}>();

function defaultGoBack() {
  if (window.history.length > 1) router.back();
  else router.push('/')
}


</script>

<template>
  <div class="container pb-t overflow-auto h-100">
    <div class="row justify-content-center">
      <div class="col-6 col-md-5 col-lg-4">
        <BtnCmp @click="() => props.goBack ? props.goBack() : defaultGoBack()" variant="outline" color="secondary"
          class="shadow-sm mt-auto">
          ◀ indietro
        </BtnCmp>
      </div>
      <div class="col-6 col-md-5 col-lg-4 d-flex align-items-end justify-content-end">
        <p v-if="props.title && props.title !== ''" class="mb--2 text-secondary">{{ props.title }}</p>
      </div>
      <div class="col-12"></div>
      <div class="col-12 col-md-10 col-lg-8 mt-2">
        <div class="card shadow-sm">
          <div class="card-body" v-bind="attrs">
            <slot></slot>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>