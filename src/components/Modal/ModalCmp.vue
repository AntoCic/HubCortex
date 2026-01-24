<!-- src/components/ModalCmp.vue -->
<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch, computed, useSlots, useAttrs } from 'vue'
import { Modal } from 'bootstrap' // Bootstrap 5 JS
import BtnCmp, { type BtnColor, type BtnVariant } from '../Btn/BtnCmp.vue'


type Size = 'sm' | 'lg' | 'xl'
type FullscreenBP = true | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'
type Backdrop = boolean | 'static'

const props = withDefaults(defineProps<{
  /** v-model: apre/chiude la modal */
  modelValue?: boolean | string | number
  /** Titolo di default, se non si usa lo slot header */
  title?: string
  /** sm | lg | xl */
  size?: Size
  /** true | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' (usa la variante -down) */
  fullscreen?: FullscreenBP
  /** Centra verticalmente la dialog */
  centered?: boolean
  /** Rende scrollabile il body della dialog */
  scrollable?: boolean
  /** Backdrop: true/false/'static' (default true) */
  backdrop?: Backdrop
  /** Abilita chiusura con ESC (default true) */
  keyboard?: boolean
  /** Teleport destination (default 'body') */
  teleportTo?: string
  /** Testi bottoni default nel footer */
  okText?: string
  cancelText?: string
  /** Varianti bootstrap per i bottoni default */
  okClass?: string
  cancelClass?: string
  /** Varianti bootstrap per i bottoni default */
  okColor?: BtnColor
  cancelColor?: BtnColor
  /** Varianti bootstrap per i bottoni default */
  okVariant?: BtnVariant
  cancelVariant?: BtnVariant
  /** Chiudi automaticamente quando premo OK (default true) */
  closeOnOk?: boolean
  /** Nasconde la X in header (se si usa header di default) */
  hideHeaderClose?: boolean
  /** ID opzionale del modal root */
  id?: string

  onOk?: () => void | Promise<void>
}>(), {
  closeOnOk: true,
})

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'show'): void
  (e: 'shown'): void
  (e: 'hide'): void
  (e: 'hidden'): void
  (e: 'cancel'): void
  (e: 'close'): void
}>()

const slots = useSlots()
const attrs = useAttrs()

const modalEl = ref<HTMLElement | null>(null)
const okLoading = ref<boolean>(false);
let instance: Modal | null = null

const hasHeaderSlot = computed(() => !!slots.header)
const hasFooterSlot = computed(() => !!slots.footer)

const modalDialogClass = computed(() => {
  const classes: string[] = ['modal-dialog']
  if (props.centered) classes.push('modal-dialog-centered')
  if (props.scrollable) classes.push('modal-dialog-scrollable')
  if (props.size) classes.push(`modal-${props.size}`)
  if (props.fullscreen === true) {
    classes.push('modal-fullscreen')
  } else if (typeof props.fullscreen === 'string') {
    classes.push(`modal-fullscreen-${props.fullscreen}-down`)
  }
  return classes.join(' ')
})


function wireBootstrapEvents() {
  if (!modalEl.value) return
  modalEl.value.addEventListener('show.bs.modal', () => emit('show'))
  modalEl.value.addEventListener('shown.bs.modal', () => emit('shown'))
  modalEl.value.addEventListener('hide.bs.modal', () => emit('hide'))
  modalEl.value.addEventListener('hidden.bs.modal', () => {
    emit('hidden')
    // Sincronizza v-model a false se chiusa dall'esterno (X, ESC, backdrop)
    emit('update:modelValue', false)
  })
}

function ensureInstance() {
  if (!modalEl.value) return
  if (!instance) {
    instance = new Modal(modalEl.value, {
      backdrop: props.backdrop ?? true,
      keyboard: props.keyboard ?? true,
      focus: true
    })
    wireBootstrapEvents()
  }
}

function open() {
  ensureInstance()
  instance?.show()
}
function close() {
  emit('close')
  instance?.hide()
}
function toggle() {
  ensureInstance()
  instance?.toggle()
}
defineExpose({ open, close, toggle })

// Reagisci a v-model esterno
watch(
  () => props.modelValue,
  (v) => {
    if (!modalEl.value) return
    ensureInstance()
    if (typeof v === 'string' ? v.trim() !== '' : v) {
      open()
    } else {
      close()
    }
  },
  { immediate: true }
)

onMounted(() => {
  // Se modelValue è true al mount, apri
  if (props.modelValue) open()
})

onBeforeUnmount(() => {
  instance?.hide()
  // instance?.dispose?.() se ho problemi che i addEventListener riattivare e trovare unaltra soluzione ma non penso sia un problema
  instance = null
})

async function onClickOk() {
  okLoading.value = true;
  try {
    await Promise.resolve(props.onOk?.());
    if (props.closeOnOk ?? true) close()
  } catch (err) {
    console.error('[ModalCmp] okAction error:', err)
  } finally {
    okLoading.value = false
  }
}
function onClickCancel() {
  emit('cancel')
  close()
}
</script>

<template>
  <!-- Teletrasporta fuori dall'albero per evitare overflow/positioning -->
  <teleport :to="teleportTo ?? 'body'">
    <div class="modal fade" :id="id" tabindex="-1" aria-hidden="true" ref="modalEl" v-bind="attrs">
      <div :class="modalDialogClass">
        <div class="modal-content">
          <!-- HEADER -->
          <div class="modal-header" v-if="hasHeaderSlot || title">
            <slot name="header">
              <h5 class="modal-title">{{ title }}</h5>
              <button v-if="!hideHeaderClose" type="button" class="btn-close" aria-label="Close"
                @click="close"></button>
            </slot>
          </div>

          <!-- BODY -->
          <div class="modal-body">
            <slot>
            </slot>
          </div>

          <!-- FOOTER -->
          <div class="modal-footer" v-if="hasFooterSlot || okText || cancelText">
            <slot name="footer">
              <BtnCmp v-if="cancelText !== undefined" type="button" :class="props.cancelClass"
                :color="props.cancelColor" :variant="props.cancelVariant ?? 'ghost'" @click="onClickCancel">
                {{ cancelText ?? 'Annulla' }}
              </BtnCmp>
              <BtnCmp v-if="okText !== undefined" type="button" :class="props.okClass" :color="props.okColor"
                :variant="props.okVariant" @click="onClickOk" :loading="okLoading">
                {{ okText ?? 'OK' }}
              </BtnCmp>
            </slot>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<style scoped lang="scss">
/* Nessuno stile obbligatorio: delega a Bootstrap */
</style>
