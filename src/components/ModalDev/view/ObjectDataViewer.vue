<script setup lang="ts">
import BtnCmp from '../../Btn/BtnCmp.vue';
import { ref } from 'vue';

const { obj } = defineProps<{ obj: any }>()
const maxDepth = ref(6);
const maxKeys = ref(80);
const maxArray = ref(50);

// Duck-typing: abbastanza robusto per DocumentReference v9/v10
function isFirestoreDocRef(v: any): v is { id?: string; path?: string } {
  return !!v
    && typeof v === 'object'
    && (typeof v.path === 'string' || typeof v.id === 'string')
    && ('firestore' in v || 'parent' in v) // segnali tipici
}

function refLabel(v: any) {
  if (!v || typeof v !== 'object') return '[Ref]'
  const p = typeof v.path === 'string' ? v.path : undefined
  const id = typeof v.id === 'string' ? v.id : undefined
  return `[Ref${p ? ` ${p}` : id ? ` ${id}` : ''}]`
}

interface optionsViewer {
  maxDepth: number,
  maxKeys: number,
  maxArray: number,
}
function safeStringify(obj: any, opt: optionsViewer) {
  const { maxDepth, maxKeys, maxArray } = opt;

  const seen = new WeakSet<object>()

  function walk(value: any, depth: number, key?: string): any {
    // fast path
    if (value === null || value === undefined) return value
    const t = typeof value
    if (t === 'string' || t === 'number' || t === 'boolean') return value
    if (t === 'bigint') return value.toString()
    if (t === 'function') return '[Function]'
    if (t === 'symbol') return value.toString()

    // Key-based "ref": non espandere
    if (key && key === 'ref') return '[Ref]'

    // Value-based Firestore ref: non espandere
    if (isFirestoreDocRef(value)) return refLabel(value)

    // depth cut
    if (depth >= maxDepth) return '[MaxDepth]'

    // circular
    if (typeof value === 'object') {
      if (seen.has(value)) return '[Circular]'
      seen.add(value)
    }

    // Array cut
    if (Array.isArray(value)) {
      const out = value.slice(0, maxArray).map(v => walk(v, depth + 1))
      if (value.length > maxArray) out.push(`[... +${value.length - maxArray} more]`)
      return out
    }

    // Date / Timestamp-like
    if (value instanceof Date) return value.toISOString()

    // Object cut (maxKeys)
    const keys = Object.keys(value)
    const limited = keys.slice(0, maxKeys)

    const out: Record<string, any> = {}
    for (const k of limited) out[k] = walk(value[k], depth + 1, k)

    if (keys.length > maxKeys) out.__truncatedKeys = `+${keys.length - maxKeys} more keys`
    return out
  }

  try {
    return JSON.stringify(walk(obj, 0), null, 2)
  } catch {
    return '[unstringifiable]'
  }
}

</script>

<template>
  <div class="container-fluid">
    <div class="row justify-content-center g-3 my-3">

      <div class="col-12 col-md-4 col-lg-3">
        <div class="border rounded p-3 text-center shadow-sm h-100">
          <div class="fw-semibold mb-2">Max Depth</div>

          <div class="d-flex justify-content-center align-items-center gap-2">
            <BtnCmp icon="minimize" @click="() => maxDepth--" />
            <span class="fw-bold">{{ maxDepth }}</span>
            <BtnCmp icon="add" @click="() => maxDepth++" />
          </div>
        </div>
      </div>

      <div class="col-12 col-md-4 col-lg-3">
        <div class="border rounded p-3 text-center shadow-sm h-100">
          <div class="fw-semibold mb-2">Max Keys</div>

          <div class="d-flex justify-content-center align-items-center gap-2">
            <BtnCmp icon="minimize" @click="() => maxKeys--" />
            <span class="fw-bold">{{ maxKeys }}</span>
            <BtnCmp icon="add" @click="() => maxKeys++" />
          </div>
        </div>
      </div>

      <div class="col-12 col-md-4 col-lg-3">
        <div class="border rounded p-3 text-center shadow-sm h-100">
          <div class="fw-semibold mb-2">Max Array</div>

          <div class="d-flex justify-content-center align-items-center gap-2">
            <BtnCmp icon="minimize" @click="() => maxArray--" />
            <span class="fw-bold">{{ maxArray }}</span>
            <BtnCmp icon="add" @click="() => maxArray++" />
          </div>
        </div>
      </div>

    </div>


  </div>
  <pre class="w-100">{{ safeStringify(obj, { maxDepth, maxKeys, maxArray }) }}</pre>
</template>

<style scoped lang="scss"></style>
