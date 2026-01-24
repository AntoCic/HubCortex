<script setup lang="ts">
import { computed, ref } from 'vue'
import BtnCmp from '../Btn/BtnCmp.vue'
import AvatarUserCmp from './AvatarUserCmp.vue'
import { AvatarUser } from './AvatarUser'
import AvatarUserPicker from './AvatarUserPicker.vue'

const avatars = computed(() => AvatarUser.getAll())
const selected = ref<AvatarUser | undefined>(avatars.value?.[0])
function selectAvatar(a: AvatarUser) {
  selected.value = a
}

function randomColors() {
  selected.value?.setRandomColors()
}

</script>

<template>
  <div class="container overflow-auto">
    <div class="row">
      <div class="col-12">
        <hr>
      </div>
      <div class="col-12">
        <AvatarUserPicker v-model="selected" :preview="true" />
        <!-- oppure -->
      </div>
      <div class="col-12">
        <hr>
      </div>
      <div class="col-12">
        <AvatarUserPicker v-model="selected" :preview="false" />
      </div>

      <div class="col-12">
        <hr>
      </div>

      <div class="col-12">

        <div v-if="selected" class="d-flex gap-4 align-items-start flex-wrap container py-4  h-100">
          <div class="d-flex flex-column gap-3">
            <AvatarUserCmp :avatar="selected" :alt="`Avatar ${selected?.name}`"
              class="avatar-preview border rounded-3 p-2 bg-white" />
            <div class="card">
              <div class="card-body d-flex flex-column gap-3">

                <BtnCmp icon="casino" @click="randomColors" />
                <div class="d-flex gap-3">
                  <input type="color" class="form-control form-control-color" v-model="selected.skin"
                    title="Seleziona colore maglietta" />
                  <input type="color" class="form-control form-control-color" v-model="selected.hair"
                    title="Seleziona colore maglietta" />
                  <input type="color" class="form-control form-control-color" v-model="selected.shirt"
                    title="Seleziona colore maglietta" />
                </div>
              </div>
            </div>
          </div>

          <div class="avatars-panel">
            <div class="row g-2">
              <div class="col-4" v-for="(avatar, i) in avatars" :key="'option-avatar-' + i">
                <button type="button" class="avatar-thumb btn w-100 p-2" :class="{ 'active': avatar === selected }"
                  @click="selectAvatar(avatar)" :aria-label="`Seleziona avatar ${avatar}`">
                  <AvatarUserCmp :avatar="avatar" :alt="`Avatar ${avatar.name}`" class="thumb-img" loading="lazy" />
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
  border: 1px solid rgba(0, 0, 0, .15);
  background: #fff;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-thumb.active {
  border-color: rgba(13, 110, 253, 0.9);
  /* bootstrap primary-ish */
  box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.15);
}

.thumb-img :deep(svg) {
  width: 72px;
  height: 72px;
  display: block;
}
</style>
