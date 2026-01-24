<script setup lang="ts">
import { computed } from 'vue'
import BtnCmp from '../Btn/BtnCmp.vue'
import AvatarUserCmp from './AvatarUserCmp.vue'
import { AvatarUser } from './AvatarUser'
import type { Gender } from '../input/Gender/FieldGender.vue';

const props = withDefaults(defineProps<{
  modelValue: AvatarUser
  preview?: boolean
  editOnHover?: boolean
  gender?: Gender
}>(), {
  preview: true,
  editOnHover: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', v: AvatarUser | undefined): void
}>()

const selected = computed<AvatarUser | undefined>({
  get() {
    return props.modelValue
  },
  set(v) {
    emit('update:modelValue', v)
  },
})

function randomColors() {
  emit('update:modelValue', AvatarUser.createRandom({ gender: props.gender }))
}
</script>

<template>
  <div class="avatar-picker py-3 overflow-auto">
    <div v-if="selected" class="avatar-picker__inner d-flex align-items-center justify-content-center flex-wrap"
      :class="{ 'preview-hover': props.editOnHover }">
      <!-- LEFT: preview + controls -->
      <div v-if="preview" class="d-flex flex-column align-items-center justify-content-center">
        <AvatarUserCmp :avatar="selected" :alt="`Avatar ${selected.name}`" class="avatar-preview p-2 bg-white" />

        <div class="avatar-controls card">
          <div class="card-body d-flex flex-column gap-3">
            <BtnCmp icon="casino" @click="randomColors" />
            <div class="d-flex gap-3">
              <input type="color" class="form-control form-control-color" v-model="selected.skin"
                title="Seleziona colore pelle" />
              <input type="color" class="form-control form-control-color" v-model="selected.hair"
                title="Seleziona colore capelli" />
              <input type="color" class="form-control form-control-color" v-model="selected.shirt"
                title="Seleziona colore maglietta" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* bordo grande esterno */
.avatar-picker {
  border: 2px solid rgba(0, 0, 0, .12);
  border-radius: 16px;
  background: #fff;
}

/* meno bordi interni: tolgo border su preview e sui thumb, li faccio più soft */
.avatar-preview {
  border-radius: 14px;
}

.avatar-preview :deep(svg) {
  width: 220px;
  height: 220px;
  display: block;
}

.avatars-panel {
  min-width: 260px;
  max-width: 320px;
}

.avatar-thumb {
  border: 1px solid rgba(0, 0, 0, .10);
  background: #fff;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-thumb.active {
  border-color: rgba(13, 110, 253, 0.9);
  box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.12);
}

.thumb-img :deep(svg) {
  width: 72px;
  height: 72px;
  display: block;
}

.preview-hover .avatar-controls {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  pointer-events: none;
  transform: translateY(-6px);
  transition: max-height .18s ease, opacity .18s ease, transform .18s ease;
}

.preview-hover:hover .avatar-controls {
  max-height: 420px;
  /* abbastanza per mostrare tutto */
  opacity: 1;
  pointer-events: auto;
  transform: translateY(0);
}
</style>
