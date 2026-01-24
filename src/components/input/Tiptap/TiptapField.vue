<script setup lang="ts">
import { computed, onBeforeUnmount, watch, ref, onMounted } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import CodeBlock from '@tiptap/extension-code-block'
import type { Level } from '@tiptap/extension-heading'

interface Props {
    modelValue: string
    placeholder?: string
    toolbarStickyOn?: 'top' | 'bottom'
}
const props = withDefaults(defineProps<Props>(), {
    modelValue: '',
    placeholder: 'Scrivi la tua nota…',
})
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

const stickySentinel = ref<HTMLElement | null>(null)
const isStuck = ref(false)
let io: IntersectionObserver | null = null

const toolbarClass = computed(() => [
    props.toolbarStickyOn ? `position-sticky-${props.toolbarStickyOn}` : '',
    isStuck.value ? 'is-stuck' : '',
])


const blockType = computed<'paragraph' | 'h1' | 'h2' | 'h3'>(() => {
    const e = editor.value
    if (!e) return 'paragraph'
    if (e.isActive('heading', { level: 1 })) return 'h1'
    if (e.isActive('heading', { level: 2 })) return 'h2'
    if (e.isActive('heading', { level: 3 })) return 'h3'
    return 'paragraph'
})

function applyBlock(value: 'paragraph' | 'h1' | 'h2' | 'h3') {
    const e = editor.value
    if (!e) return

    if (value === 'paragraph') {
        e.chain().focus().setParagraph().run()
    } else {
        // "h1" | "h2" | "h3" -> 1 | 2 | 3
        const lvl = Number(value.slice(1)) as Level // (Level è 1|2|3|4|5|6)
        e.chain().focus().toggleHeading({ level: lvl }).run()
    }
}

// toggle link: se attivo → rimuovi; se non attivo → chiedi URL e applica
function toggleLink() {
    const e = editor.value
    if (!e) return

    const isLink = e.isActive('link')
    if (isLink) {
        e.chain().focus().unsetLink().run()
        return
    }

    const current = e.getAttributes('link')?.href as string | undefined
    const url = window.prompt('URL:', current || '')?.trim()
    if (!url) return

    // piccola validazione minima; Link ext ha già "protocols"
    const valid = /^(https?:\/\/|mailto:|tel:)/i.test(url)
    e.chain().focus().setLink({ href: valid ? url : `https://${url}` }).run()
}

const editor = useEditor({
    content: props.modelValue || '<p></p>',
    extensions: [
        StarterKit.configure({
            codeBlock: false, // lo abilitiamo come estensione separata
        }),
        CodeBlock, // blocchi di codice con ``` o dal bottone
        Link.configure({
            openOnClick: true,
            autolink: true,
            protocols: ['http', 'https', 'mailto', 'tel'],
        }),
        Placeholder.configure({
            placeholder: props.placeholder,
        }),
    ],
    editorProps: {
        attributes: {
            class:
                'ProseMirror p-3 overflow-auto',
        },
    },
    onUpdate: ({ editor }) => {
        emit('update:modelValue', editor.getHTML())
    },
})

// Se cambia il valore da fuori (es. load da DB), riallinea l’editor
watch(
    () => props.modelValue,
    (html) => {
        const e = editor.value
        if (!e) return
        if (html !== e.getHTML()) {
            e.commands.setContent(html || '<p></p>', { emitUpdate: false })
        }
    }
)

onMounted(() => {
    if (!props.toolbarStickyOn) return

    // Sentinel: quando NON è più visibile => toolbar si è attaccata (stuck)
    io = new IntersectionObserver(
        ([entry]) => {
            if (entry) isStuck.value = !entry.isIntersecting
        },
        {
            root: null,          // viewport
            threshold: [1],      // “visibile al 100%”
            rootMargin: props.toolbarStickyOn === 'top'
                ? '-8px 0px 0px 0px'   // coerente col tuo top: 8px
                : '0px 0px -8px 0px',  // coerente col tuo bottom: 8px
        }
    )

    if (stickySentinel.value) io.observe(stickySentinel.value)
})

onBeforeUnmount(() => {
    editor.value?.destroy()
    io?.disconnect()
    io = null
})

// Toolbar helpers
const canUndo = computed(() => editor.value?.can().chain().focus().undo().run())
const canRedo = computed(() => editor.value?.can().chain().focus().redo().run())

</script>

<template>
    <div class="tiptap-field">
        <div ref="stickySentinel" class="tt-sticky-sentinel" aria-hidden="true"></div>
        <div ref="toolbarEl" class="tt-toolbar" :class="toolbarClass">
            <!-- Selettore grandezza testo -->
            <select class="tt-select" :value="blockType"
                @change="applyBlock(($event.target as HTMLSelectElement).value as any)">
                <option value="paragraph">Normale</option>
                <option value="h1">Titolo 1</option>
                <option value="h2">Titolo 2</option>
                <option value="h3">Titolo 3</option>
            </select>

            <span class="tt-sep"></span>

            <!-- Inline styles -->
            <button class="tt-btn" :class="editor?.isActive('bold') ? 'is-active' : ''" title="Grassetto"
                @click="editor?.chain().focus().toggleBold().run()">
                <span class="material-symbols-outlined">format_bold</span>
            </button>

            <button class="tt-btn" :class="editor?.isActive('italic') ? 'is-active' : ''" title="Corsivo"
                @click="editor?.chain().focus().toggleItalic().run()">
                <span class="material-symbols-outlined">format_italic</span>
            </button>

            <button class="tt-btn" :class="editor?.isActive('code') ? 'is-active' : ''" title="Inline code"
                @click="editor?.chain().focus().toggleCode().run()">
                <span class="material-symbols-outlined">code</span>
            </button>

            <span class="tt-sep"></span>

            <!-- Liste -->
            <button class="tt-btn" :class="editor?.isActive('bulletList') ? 'is-active' : ''" title="Elenco puntato"
                @click="editor?.chain().focus().toggleBulletList().run()">
                <span class="material-symbols-outlined">format_list_bulleted</span>
            </button>

            <button class="tt-btn" :class="editor?.isActive('orderedList') ? 'is-active' : ''" title="Elenco numerato"
                @click="editor?.chain().focus().toggleOrderedList().run()">
                <span class="material-symbols-outlined">format_list_numbered</span>
            </button>

            <span class="tt-sep"></span>

            <!-- Code block -->
            <button class="tt-btn" :class="editor?.isActive('codeBlock') ? 'is-active' : ''" title="Code block"
                @click="editor?.chain().focus().toggleCodeBlock().run()">
                <span class="material-symbols-outlined">code_blocks</span>
            </button>

            <!-- Link (toggle) -->
            <button class="tt-btn" :class="editor?.isActive('link') ? 'is-active' : ''" title="Link (toggle)"
                @click="toggleLink()">
                <span class="material-symbols-outlined">link</span>
            </button>

            <button class="tt-btn" :disabled="!canUndo" title="Annulla" @click="editor?.chain().focus().undo().run()">
                <span class="material-symbols-outlined">undo</span>
            </button>
            <button class="tt-btn" :disabled="!canRedo" title="Ripeti" @click="editor?.chain().focus().redo().run()">
                <span class="material-symbols-outlined">redo</span>
            </button>
        </div>

        <EditorContent :editor="editor" :style="{ height: 'calc(100% - 80px)' }" />
    </div>
</template>
<style lang="scss" scoped>
$t-border: var(--bs-border-color, #e5e7eb);
$t-bg: var(--bs-body-bg, #fff);
$t-primary: var(--bs-primary, #0d6efd);
$t-secondary-bg: var(--bs-secondary-bg, #f3f4f6);

/* Contenitore editor + toolbar */
.tiptap-field {

    .tt-sticky-sentinel {
        height: 1px;
    }

    /* Toolbar compatta e pulita */
    .tt-toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: .25rem;
        padding: .25rem;
        border: 1px solid $t-border;
        background: $t-bg;
        border-top-left-radius: .5rem;
        border-top-right-radius: .5rem;
        border-bottom: none; // si “aggancia” all’editor

        &.position-sticky-top.is-stuck,
        &.position-sticky-bottom.is-stuck {
            position: sticky;
            left: 0;
            right: 0;
            z-index: 9999;
            border-bottom: 1px solid $t-border;
            border-radius: .5rem;
            box-shadow: 0 6px 24px rgba(0, 0, 0, .08);
            background: var(--colors-theme-bg-accent-hover-alpha, #00000006);
            backdrop-filter: blur(40px);
            width: fit-content;
            margin: 0 auto;
        }

        &.position-sticky-top {
            top: 16px;
        }

        &.position-sticky-bottom {
            bottom: 16px;
        }
    }

    /* Separatori verticali */
    .tt-sep {
        width: 1px;
        align-self: stretch;
        background: $t-border;
        margin: 0 .125rem;
    }

    /* Pulsante icon-only */
    .tt-btn {
        appearance: none;
        border: none;
        background: transparent;
        padding: .4rem;
        border-radius: .375rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        line-height: 1;

        &:hover {
            background: $t-secondary-bg;
        }

        &:focus-visible {
            outline: 2px solid $t-primary;
            outline-offset: 2px;
        }

        &:disabled {
            opacity: .5;
            cursor: not-allowed;
        }

        &.is-active {
            /* leggero “tonal” */
            background: color-mix(in srgb, $t-primary 12%, transparent);

            :deep(.material-symbols-outlined) {
                font-variation-settings:
                    'FILL' 1,
                    'wght' 450,
                    'GRAD' 0,
                    'opsz' 24;
            }
        }
    }

    /* Select compatta */
    .tt-select {
        border: 1px solid $t-border;
        background: $t-bg;
        border-radius: .375rem;
        padding: .25rem .5rem;
        font-size: .9rem;
    }

    /* =========================
     PROSEMIRROR (deep scoped)
     ========================= */
    /* Stili base del contenuto */
    :deep(.ProseMirror) {
        outline: none;
        line-height: 1.5;
        border: 1px solid $t-border;
        background: $t-bg;
        border-bottom-left-radius: .5rem;
        border-bottom-right-radius: .5rem;
        min-height: 100%;

        p {
            margin: 0 0 .75rem;
        }

        pre {
            background: #0b0c0e0d;
            padding: .75rem;
            border-radius: .5rem;
            overflow: auto;
        }

        a {
            color: $t-primary;
            text-decoration: underline;
        }
    }

    /* Editor come form-control, ma:
     - niente bordo in alto
     - niente radius (editor)
     - mantiene i bordi laterali + basso
  */
    :deep(.ProseMirror.form-control) {
        border-top: none !important;
        border-radius: 0 !important;

        /* se vuoi nessun shadow bootstrap sul focus */
        &:focus {
            border-top: none !important;
            border-radius: 0 !important;
            box-shadow: none;
        }
    }

    /* Utility per min-height (se non usi Tailwind) */
    .min-h-\[14rem\] {
        min-height: 14rem;
    }

    /* Material Symbols base */
    :deep(.material-symbols-outlined) {
        font-variation-settings:
            'FILL' 0,
            'wght' 400,
            'GRAD' 0,
            'opsz' 24;
        font-size: 20px; // pulsanti compatti
    }
}
</style>
