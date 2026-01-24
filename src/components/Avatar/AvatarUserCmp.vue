<script setup lang="ts">
import { computed } from 'vue'
import { AvatarUser, defaultAvatar } from './AvatarUser'

const props = defineProps<{
  avatar?: AvatarUser
}>()

const resolvedAvatar = computed(() => {
  if (props.avatar === undefined) {
    return defaultAvatar
  } else if (props.avatar instanceof AvatarUser) {
    return props.avatar
  } else {
    return new AvatarUser(props.avatar)
  }
})
</script>

<template>
  <div class="avatar-box" :style="resolvedAvatar.style" v-html="resolvedAvatar.html" />
</template>

<style scoped>
.avatar-box :deep(svg) {
  display: block;
}
</style>
