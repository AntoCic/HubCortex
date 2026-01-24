<script setup lang="ts">
import { computed, onMounted, ref, watch, nextTick } from 'vue'

type Emits = {
    (e: 'update:modelValue', value: string[]): void
    (e: 'change', value: string[]): void
    (e: 'add', tag: string): void
    (e: 'remove', tag: string): void
}

const props = withDefaults(defineProps<{
    modelValue: string[]
    suggestions?: string[]
    placeholder?: string
    allowDuplicates?: boolean
    caseSensitive?: boolean
    maxTags?: number | null
}>(), {
    suggestions: () => [],
    placeholder: 'Aggiungi tag…',
    allowDuplicates: false,
    caseSensitive: false,
    maxTags: null,
})

const emit = defineEmits<Emits>()

const inputEl = ref<HTMLInputElement | null>(null)
const inputValue = ref('')
const isFocused = ref(false)
const highlighted = ref<number>(-1)
const open = ref(false)

const normalized = (s: string) => (props.caseSensitive ? s.trim() : s.trim().toLowerCase())

const tags = computed<string[]>({
    get: () => props.modelValue ?? [],
    set: (v) => {
        emit('update:modelValue', v)
        emit('change', v)
    },
})

const alreadyHas = (value: string) => {
    const nv = normalized(value)
    return tags.value.some(t => normalized(t) === nv)
}

const canAddMore = computed(() => props.maxTags == null || tags.value.length < props.maxTags)

const filteredSuggestions = computed(() => {
    const q = normalized(inputValue.value)
    if (!q) return []
    const available = props.suggestions ?? []
    const list = available.filter(sug => normalized(sug).includes(q))
    // Escludi duplicati esistenti (se non permessi)
    return list.filter(sug => props.allowDuplicates || !alreadyHas(sug))
})

function openDropdown() {
    open.value = filteredSuggestions.value.length > 0 && isFocused.value
}

watch([() => inputValue.value, () => isFocused.value, () => props.suggestions], () => {
    highlighted.value = filteredSuggestions.value.length ? 0 : -1
    openDropdown()
})

function addTag(raw: string) {
    const value = raw.trim()
    if (!value) return
    if (!props.allowDuplicates && alreadyHas(value)) {
        inputValue.value = ''
        return
    }
    if (!canAddMore.value) return
    tags.value = [...tags.value, value]
    emit('add', value)
    inputValue.value = ''
    highlighted.value = -1
    open.value = false
    nextTick(() => inputEl.value?.focus())
}

function removeTagAt(index: number) {
    const removed = tags.value[index]
    if (!removed) throw new Error("removeTagAt tag to remove not found");
    const next = tags.value.slice(0, index).concat(tags.value.slice(index + 1))
    tags.value = next
    emit('remove', removed)
}

function removeLastIfEmpty() {
    if (inputValue.value === '' && tags.value.length > 0) {
        removeTagAt(tags.value.length - 1)
    }
}

function onKeydown(e: KeyboardEvent) {
    if (!isFocused.value) return

    // Conferma tag
    if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab') {
        if (e.key !== 'Tab') e.preventDefault()
        if (open.value && highlighted.value >= 0 && filteredSuggestions.value[highlighted.value]) {
            const suggestion = filteredSuggestions.value[highlighted.value]
            if (typeof suggestion === 'string') {
                addTag(suggestion)
            }
        } else {
            addTag(inputValue.value)
        }
        return
    }

    // Navigazione suggerimenti
    if (e.key === 'ArrowDown') {
        e.preventDefault()
        if (!open.value) openDropdown()
        if (filteredSuggestions.value.length) {
            highlighted.value = (highlighted.value + 1) % filteredSuggestions.value.length
        }
        return
    }
    if (e.key === 'ArrowUp') {
        e.preventDefault()
        if (filteredSuggestions.value.length) {
            highlighted.value =
                (highlighted.value - 1 + filteredSuggestions.value.length) % filteredSuggestions.value.length
        }
        return
    }

    // Chiudi dropdown
    if (e.key === 'Escape') {
        open.value = false
        highlighted.value = -1
        return
    }

    // Backspace per rimuovere ultimo tag
    if (e.key === 'Backspace') {
        removeLastIfEmpty()
    }
}

function onSuggestionClick(s: string) {
    addTag(s)
}

function onBlur() {
    setTimeout(() => {
        if (inputValue.value.trim() !== '') {
            addTag(inputValue.value)
        }

        isFocused.value = false
        open.value = false
    }, 120)
}
onMounted(() => {
    // Apertura iniziale se serve
    openDropdown()
})

</script>

<template>
    <div class="tag-input w-100">
        <div class="form-control d-flex flex-wrap align-items-center gap-2 p-2" @click="inputEl?.focus()">
            <!-- Tag pills -->
            <span v-for="(t, i) in tags" :key="t + '-' + i"
                class="badge rounded-pill text-bg-primary d-inline-flex align-items-center gap-1">
                <span class="text-truncate">{{ t }}</span>
                <button type="button" class="btn-close btn-close-white ms-1" aria-label="Remove"
                    @click.stop="removeTagAt(i)" />
            </span>

            <!-- Input -->
            <input ref="inputEl" type="text" class="border-0 flex-grow-1 minw-120"
                :placeholder="tags.length === 0 ? placeholder : ''" v-model="inputValue"
                @focus="isFocused = true; openDropdown()" @blur="onBlur" @keydown="onKeydown" autocomplete="off" />
        </div>

        <!-- Suggerimenti -->
        <div v-if="open && filteredSuggestions.length" class="dropdown-menu show w-100 mt-1"
            style="max-height: 220px; overflow:auto;" role="listbox">
            <button v-for="(s, i) in filteredSuggestions" :key="s + '-' + i" type="button" class="dropdown-item"
                :class="{ active: i === highlighted }" @mousedown.prevent="onSuggestionClick(s)"
                :aria-selected="i === highlighted" role="option">
                {{ s }}
            </button>
        </div>

        <!-- Limite raggiunto -->
        <small v-if="!canAddMore" class="text-muted d-block mt-1">
            Hai raggiunto il numero massimo di tag ({{ maxTags }}).
        </small>
    </div>
</template>

<style lang="scss" scoped>
.tag-input {
    .form-control {
        cursor: text;
        min-height: 44px;
    }

    input {
        outline: none;

        &:focus {
            box-shadow: none;
        }
    }

    .minw-120 {
        min-width: 120px;
    }

    // .dropdown-menu {
    // }
}
</style>
