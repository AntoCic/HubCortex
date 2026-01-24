<!-- src/views/NotifyTestView.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import { LS } from '../../localStorage/LS';
import { LocalStorageKey, LocalStorageKeys } from '@shared/enums/LocalStorageKey';

const activeIndex = ref<number>(0)
const setActive = (i: number) => { activeIndex.value = i }
const tabs = ref<LocalStorageKey[]>(LocalStorageKeys);

// Tenta il parse; se è JSON valido lo indenta, altrimenti restituisce la stringa originale
function prettyFor(key: LocalStorageKey): string {
  const raw = LS.getStr(key) ?? ''
  // piccolo short-circuit per evitare parse inutili
  const first = raw.trim().charAt(0)
  const looksJson = first === '{' || first === '['
  if (!looksJson) return raw
  try {
    const parsed = JSON.parse(raw)
    return JSON.stringify(parsed, null, 2)
  } catch {
    return raw
  }
}
</script>

<template>
  <nav class="nav-scoped flex-shrink-0">
    <div class="nav nav-tabs border-0" role="tablist">
      <button v-for="(tab, i) in tabs" :key="tab" class="nav-link text-info" :class="{ active: i === activeIndex }"
        type="button" role="tab" @click="setActive(i)">
        {{ tab }}
      </button>
    </div>
  </nav>

  <div class="tab-content scoped p-2 overflow-y-auto flex-grow-1">
    <div v-for="(tab, i) in tabs" :key="tab" class="tab-pane fade" :class="{ 'show active': i === activeIndex }"
      role="tabpanel" tabindex="0">
      <pre v-if="i === activeIndex" class="json-pre">
        <code>{{ prettyFor(tab) }}</code>
      </pre>
    </div>
  </div>
</template>

<style scoped lang="scss">
.json-pre {
  background: #0f172a0d;
  /* leggero sfondo */
  border: 1px solid #e2e8f0;
  border-radius: .5rem;
  padding: .75rem 1rem;
  line-height: 1.45;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  font-size: .9rem;
  white-space: pre;
  /* mantieni indentazione */
  overflow: auto;
  max-height: 80vh;
}
</style>
