<script setup lang="ts">
import { ref, computed } from 'vue'

type NamedSize = 'sm' | 'md' | 'lg' | 'xl'
type Shape = 'square' | 'circle' | 'octagon'

interface Props {
    imgUrl?: string | null
    initials?: string
    onFileChange: (file: File) => Promise<void>
    size?: NamedSize | number
    title?: string
    disabled?: boolean
    /** Se presente, mostra la X e la esegue al click (solo se imgUrl è valorizzato) */
    onFileDelete?: () => Promise<void> | void
    /** Forma del contenitore */
    shape?: Shape
}
const props = withDefaults(defineProps<Props>(), {
    imgUrl: null,
    initials: '',
    size: 'md',
    title: 'Clicca per cambiare immagine',
    disabled: false,
    shape: 'circle',
})

const emit = defineEmits<{
    (e: 'error', message: string): void
    (e: 'success'): void
    (e: 'deleted'): void
    (e: 'delete-error', message: string): void
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const pending = ref(false)
const pendingDelete = ref(false)
const error = ref<string | null>(null)

/** Mappa taglie nominali -> px */
const pxSize = computed(() => {
    const s = props.size
    if (typeof s === 'number') return s
    switch (s) {
        case 'sm': return 40
        case 'md': return 64
        case 'lg': return 96
        case 'xl': return 128
        default: return 64
    }
})

/** Stato calcolato */
const hasImg = computed(() => !!props.imgUrl && !pending.value)
const showFallback = computed(() => !pending.value && !props.imgUrl)
const showDeleteBtn = computed(() =>
    !!props.onFileDelete && !!props.imgUrl && !pending.value && !props.disabled
)

/** Classi forma */
const shapeClass = computed(() => {
    switch (props.shape) {
        case 'square': return 'shape--square'
        case 'octagon': return 'shape--octagon'
        case 'circle':
        default: return 'shape--circle'
    }
})

/** Azioni */
function openPicker() {
    if (props.disabled || pending.value || pendingDelete.value) return
    fileInput.value?.click()
}

async function handleInputChange(e: Event) {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    input.value = '' // reset per poter riselezionare lo stesso file
    if (!file || props.disabled) return

    error.value = null
    pending.value = true
    try {
        await props.onFileChange(file)
        emit('success')
    } catch (err: any) {
        const msg = err?.message ?? 'Errore caricamento'
        error.value = msg
        emit('error', msg)
    } finally {
        pending.value = false
    }
}

async function handleDelete(ev: MouseEvent) {
    ev.stopPropagation() // non aprire il file picker
    if (!props.onFileDelete || !props.imgUrl || props.disabled || pending.value) return
    error.value = null
    pendingDelete.value = true
    try {
        await props.onFileDelete()
        emit('deleted')
    } catch (err: any) {
        const msg = err?.message ?? 'Errore eliminazione'
        error.value = msg
        emit('delete-error', msg)
    } finally {
        pendingDelete.value = false
    }
}
</script>

<template>
    <div class="avatar-wrap" :class="shapeClass"
        :style="{ width: `${pxSize}px`, height: `${pxSize}px`, opacity: disabled ? .6 : 1 }" role="button"
        :aria-label="title" :title="title" @click="openPicker">
        <!-- Stato: immagine presente -->
        <img v-if="hasImg" :src="imgUrl as string" alt="Avatar" class="avatar-img"
            :style="{ width: `${pxSize}px`, height: `${pxSize}px` }" draggable="false" />

        <!-- Stato: fallback con iniziali -->
        <div v-else-if="showFallback" class="avatar-fallback"
            :style="{ width: `${pxSize}px`, height: `${pxSize}px`, fontSize: `${Math.max(12, pxSize / 3)}px` }">
            {{ initials || '??' }}
        </div>

        <!-- Stato: loading -->
        <div v-else class="avatar-loading" :style="{ width: `${pxSize}px`, height: `${pxSize}px` }" aria-busy="true"
            aria-live="polite">
            <div class="spinner" />
        </div>

        <!-- Pulsante delete (se abilitato e presente immagine) -->
        <button v-if="showDeleteBtn" class="btn-delete" type="button" :disabled="pendingDelete"
            aria-label="Rimuovi immagine" title="Rimuovi immagine" @click="handleDelete">
            <span v-if="!pendingDelete">×</span>
            <span v-else class="mini-spinner" />
        </button>

        <!-- Overlay “camera” che comunica la cliccabilità -->
        <div class="overlay" :class="{ 'overlay--disabled': disabled }">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" class="camera" aria-hidden="true">
                <path
                    d="M480-480ZM200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h320v80H200v560h560v-320h80v320q0 33-23.5 56.5T760-120H200Zm40-160h480L570-480 450-320l-90-120-120 160Zm440-320v-80h-80v-80h80v-80h80v80h80v80h-80v80h-80Z"
                    fill="currentColor" />
            </svg>
        </div>

        <!-- input file nascosto -->
        <input ref="fileInput" type="file" accept="image/*" class="hidden-input" @change="handleInputChange"
            :disabled="disabled" />
    </div>

    <p v-if="error" class="error">{{ error }}</p>
</template>

<style scoped>
.avatar-wrap {
    position: relative;
    overflow: hidden;
    cursor: pointer;
    user-select: none;
    border: 1px solid var(--border, #e5e7eb);
    background: #f3f4f6;
}

/* forme */
.shape--circle {
    border-radius: 999px;
}

.shape--square {
    border-radius: 0;
}

.shape--octagon {
    /* Lati diagonali metà lunghezza dei lati ortogonali: offset 25% */
    clip-path: polygon(25% 0%,
            75% 0%,
            100% 25%,
            100% 75%,
            75% 100%,
            25% 100%,
            0% 75%,
            0% 25%);
    border-radius: 0;
    /* evitiamo smussature con clip-path */
}

/* immagine */
.avatar-img {
    display: block;
    object-fit: cover;
    width: 100%;
    height: 100%;
    pointer-events: none;
}

/* fallback | loading */
.avatar-fallback,
.avatar-loading {
    display: grid;
    place-items: center;
    width: 100%;
    height: 100%;
    color: #6b7280;
    background: #f9fafb;
    font-weight: 600;
}

/* spinner principale */
.spinner {
    width: 28px;
    height: 28px;
    border-radius: 999px;
    border: 3px solid rgba(0, 0, 0, 0.15);
    border-top-color: rgba(0, 0, 0, 0.55);
    animation: spin 0.8s linear infinite;
}

/* mini spinner nel bottone delete */
.mini-spinner {
    display: inline-block;
    width: 14px;
    height: 14px;
    border-radius: 999px;
    border: 2px solid rgba(0, 0, 0, 0.15);
    border-top-color: rgba(0, 0, 0, 0.55);
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

/* overlay camera */
.overlay {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    background: radial-gradient(transparent 55%, rgba(0, 0, 0, 0.45));
    opacity: 0;
    transition: opacity .15s ease;
    pointer-events: none;
    color: white;
}

.avatar-wrap:hover .overlay {
    opacity: 1;
    pointer-events: none;
    /* non bloccare il click sul container */
}

.overlay--disabled {
    display: none;
}

.camera {
    width: 22%;
    height: 22%;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, .4));
}

/* bottone delete */
.btn-delete {
    position: absolute;
    top: 6px;
    right: 6px;
    z-index: 2;
    width: 24px;
    height: 24px;
    line-height: 22px;
    font-size: 16px;
    font-weight: 700;
    text-align: center;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.9);
    color: #111827;
    border: 1px solid #e5e7eb;
    box-shadow: 0 1px 2px rgba(0, 0, 0, .08);
    cursor: pointer;
}

.btn-delete:hover {
    background: #ffffff;
}

.btn-delete:disabled {
    opacity: .6;
    cursor: not-allowed;
}

/* input nascosto */
.hidden-input {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    border: 0;
}

.error {
    margin-top: .5rem;
    color: #b91c1c;
    font-size: .9rem;
}
</style>
