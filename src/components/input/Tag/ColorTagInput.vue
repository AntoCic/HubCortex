<script setup lang="ts">
import { computed, onMounted, ref, watch, nextTick, getCurrentInstance } from 'vue'
import type { ColorTag } from './ColorTag'

export type OnChangeColorTag = 'add' | 'edit' | 'delete'

type Emits = {
    (e: 'update:modelValue', value: ColorTag[]): void
    (e: 'change', type: OnChangeColorTag, changedTag: ColorTag, value: ColorTag[]): void
    (e: 'add', tag: ColorTag): void
    (e: 'remove', tag: ColorTag): void
    (e: 'newSuggestion', tag: ColorTag): void
    (e: 'deleteSuggestion', tag: ColorTag): void
}

const props = withDefaults(defineProps<{
    modelValue?: ColorTag[]
    suggestions?: ColorTag[]
    placeholder?: string
    allowDuplicates?: boolean
    caseSensitive?: boolean
    maxTags?: number | null
    /** Colore assegnato ai tag creati da input libero */
    defaultColor?: string
}>(), {
    modelValue: () => [],
    suggestions: () => [],
    placeholder: 'Aggiungi tag…',
    allowDuplicates: false,
    caseSensitive: false,
    maxTags: null,
    defaultColor: '#0d6efd',
})

const emit = defineEmits<Emits>();
const instance = getCurrentInstance();

const inputEl = ref<HTMLInputElement | null>(null)
const inputValue = ref('')
const isFocused = ref(false)
const highlighted = ref<number>(-1)
const open = ref(false)

const norm = (s: string) => (props.caseSensitive ? s.trim() : s.trim().toLowerCase())

const tags = computed<ColorTag[]>({
    get: () => props.modelValue ?? [],
    set: (v) => {
        emit('update:modelValue', v)
    },
})

const alreadyHas = (value: ColorTag) => {
    const nv = norm(value.label)
    return tags.value.some(t => {
        // NOTE: dup check su label; se vuoi includere il colore:
        // return norm(t.label) === nv && t.color === value.color
        return norm(t.label) === nv
    })
}

const canAddMore = computed(() => props.maxTags == null || tags.value.length < props.maxTags)

const filteredSuggestions = computed(() => {
    const q = norm(inputValue.value)
    if (!q) return []
    const list = (props.suggestions ?? []).filter(sug => norm(sug.label).includes(q))
    // Escludi duplicati esistenti (se non permessi)
    return list.filter(sug => props.allowDuplicates || !alreadyHas(sug))
})

// console.log('showDeleteSuggestion: ',attrs, attrs.onDeleteSuggestion, showDeleteSuggestion.value);
const showDeleteSuggestion = computed(() => {
    const props = instance?.vnode.props as any
    return !!props?.onDeleteSuggestion
})

function openDropdown() {
    open.value = filteredSuggestions.value.length > 0 && isFocused.value
}

watch([() => inputValue.value, () => isFocused.value, () => props.suggestions], () => {
    highlighted.value = filteredSuggestions.value.length ? 0 : -1
    openDropdown()
})

function addTagFromRaw(raw: string) {
    const label = raw.trim()
    if (!label) return
    const tag: ColorTag = { label, color: props.defaultColor }

    if (!props.allowDuplicates && alreadyHas(tag)) {
        inputValue.value = ''
        return
    }
    if (!canAddMore.value) return

    const fromSuggestions = (props.suggestions ?? []).some(s => norm(s.label) === norm(label))
    if (!fromSuggestions) {
        emit('newSuggestion', tag)
    }

    addTag(tag)
}

function addTag(tag: ColorTag) {
    if (!tag.label.trim()) return
    if (!props.allowDuplicates && alreadyHas(tag)) {
        inputValue.value = ''
        return
    }
    if (!canAddMore.value) return
    const nextValue = [...tags.value, tag]
    tags.value = nextValue
    emit('add', tag);
    emit('change', 'add', tag, nextValue)
    inputValue.value = ''
    highlighted.value = -1
    open.value = false
    nextTick(() => inputEl.value?.focus())
}

function removeTagAt(index: number) {
    const removed = tags.value[index]
    if (!removed) throw new Error("removeTagAt tag to remove not found");
    const nextValue = tags.value.slice(0, index).concat(tags.value.slice(index + 1))
    tags.value = nextValue
    emit('remove', removed)
    emit('change', 'delete', removed, nextValue)
}

function changeColorTag(index: number, color: string = props.defaultColor) {
    const toChange = tags.value[index]
    if (!toChange) throw new Error("toChange tag to change not found");
    const changedTag = { ...toChange, color }
    const nextValue = tags.value.map((x, idx) => idx === index ? changedTag : x)
    tags.value = nextValue
    emit('change', 'edit', changedTag, nextValue)
}

function deleteSuggestion(tag: ColorTag) {
    emit('deleteSuggestion', tag)
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
        const suggestion = filteredSuggestions.value[highlighted.value]
        if (open.value && highlighted.value >= 0 && suggestion) {
            addTag(suggestion)
        } else {
            addTagFromRaw(inputValue.value)
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
            highlighted.value = (highlighted.value - 1 + filteredSuggestions.value.length) % filteredSuggestions.value.length
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

function onSuggestionClick(s: ColorTag) {
    addTag(s)
}

function onBlur() {
    setTimeout(() => {
        if (inputValue.value.trim() !== '') {
            addTagFromRaw(inputValue.value)
        }
        isFocused.value = false
        open.value = false
    }, 120)
}

onMounted(() => {
    openDropdown()
})
</script>

<template>
    <div class="color-tag-input w-100 position-relative">
        <div class="form-control d-flex flex-wrap align-items-center gap-2 p-2" @click="inputEl?.focus()">
            <!-- Tag pills -->
            <span v-for="(t, i) in tags" :key="t.label + '-' + i + '-' + t.color"
                class="badge d-inline-flex align-items-center gap-2 tag-pill">
                <input type="color" class="form-control form-control-color input-color" :value="t.color"
                    @change="(e: any) => { changeColorTag(i, e?.target?.value); }" title="Choose your color">
                <span class="text-truncate">{{ t.label }}</span>
                <button type="button" class="btn-close ms-1" aria-label="Remove" @click.stop="removeTagAt(i)" />
            </span>

            <!-- Input -->
            <input ref="inputEl" type="text" class="border-0 flex-grow-1 minw-120"
                :placeholder="tags.length === 0 ? placeholder : ''" v-model="inputValue"
                @focus="isFocused = true; openDropdown()" @blur="onBlur" @keydown="onKeydown" autocomplete="off" />
        </div>

        <!-- Suggerimenti -->
        <div v-if="open && filteredSuggestions.length" class="dropdown-menu show w-100 mt-1"
            style="max-height: 220px; overflow:auto;" role="listbox">
            <button v-for="(s, i) in filteredSuggestions" :key="s.label + '-' + i + '-' + s.color" type="button"
                class="dropdown-item d-flex align-items-center gap-2" :class="{ active: i === highlighted }"
                @mousedown.prevent="onSuggestionClick(s)" :aria-selected="i === highlighted" role="option">
                <span class="color-dot" :style="{ backgroundColor: s.color }" aria-hidden="true" />
                <span class="flex-grow-1 text-truncate">{{ s.label }}</span>
                <button v-if="showDeleteSuggestion" type="button"
                    class="btn btn-sm btn-link p-0 ms-2 text-muted delete-suggestion-btn" aria-label="Delete suggestion"
                    @mousedown.prevent.stop @click.stop="deleteSuggestion(s)">
                    ✕
                </button>
            </button>
        </div>

        <!-- Limite raggiunto -->
        <small v-if="!canAddMore" class="text-muted d-block mt-1">
            Hai raggiunto il numero massimo di tag ({{ maxTags }}).
        </small>
    </div>
</template>

<style lang="scss" scoped>
.color-tag-input {
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

    .tag-pill {
        background-color: var(--bs-light);
        border: 1px solid var(--bs-border-color);
        color: var(--bs-body-color);
        padding: .35rem .5rem;
        border-radius: 50rem; // pill
    }

    .color-dot {
        width: 12px;
        height: 12px;
        border-radius: 999px;
        border: 1px solid rgba(0, 0, 0, .15);
        flex: 0 0 12px;
    }

    .input-color {
        padding: 0;
        min-height: initial;
        height: 1em;
        width: 1em;
        border-radius: 50%;
    }

    .delete-suggestion-btn {
        text-decoration: none;
        line-height: 1;
        font-size: 14px;
        opacity: .75;

        &:hover {
            opacity: 1;
        }
    }
}
</style>
