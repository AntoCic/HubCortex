<script setup lang="ts">
import { computed, onBeforeUnmount, watch } from 'vue';
import type { BtnColor, BtnVariant } from 'cic-kit';
import { Btn } from 'cic-kit';

type ModalSize = 'sm' | 'lg' | 'xl';
type ModalFullscreen = true | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

const props = withDefaults(
  defineProps<{
    modelValue: boolean | string | number;
    title?: string;
    size?: ModalSize;
    fullscreen?: ModalFullscreen;
    centered?: boolean;
    scrollable?: boolean;
    backdrop?: boolean | 'static';
    keyboard?: boolean;
    teleportTo?: string;
    okText?: string;
    cancelText?: string;
    okClass?: string;
    cancelClass?: string;
    okColor?: BtnColor;
    cancelColor?: BtnColor;
    okVariant?: BtnVariant;
    cancelVariant?: BtnVariant;
    closeOnOk?: boolean;
    hideHeaderClose?: boolean;
    id?: string;
    onOk?: () => void | Promise<void>;
  }>(),
  {
    backdrop: true,
    keyboard: true,
    teleportTo: 'body',
    cancelVariant: 'ghost',
    closeOnOk: true,
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'close'): void;
  (e: 'ok'): void;
  (e: 'cancel'): void;
}>();

const isOpen = computed(() => Boolean(props.modelValue));
const dialogClass = computed(() => {
  const classes = ['modal-dialog'];

  if (props.size) {
    classes.push(`modal-${props.size}`);
  }

  if (props.fullscreen === true) {
    classes.push('modal-fullscreen');
  } else if (props.fullscreen) {
    classes.push(`modal-fullscreen-${props.fullscreen}-down`);
  }

  if (props.centered) {
    classes.push('modal-dialog-centered');
  }

  if (props.scrollable) {
    classes.push('modal-dialog-scrollable');
  }

  return classes.join(' ');
});

watch(
  isOpen,
  (open) => {
    if (typeof window === 'undefined') return;
    if (open) {
      document.body.classList.add('modal-open');
      return;
    }

    document.body.classList.remove('modal-open');
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  if (typeof window === 'undefined') return;
  document.body.classList.remove('modal-open');
});

function closeModal() {
  emit('update:modelValue', false);
  emit('close');
}

function onBackdropClick() {
  if (props.backdrop === 'static') return;
  if (!props.backdrop) return;
  closeModal();
}

function onEscape(event: KeyboardEvent) {
  if (!props.keyboard) return;
  if (!isOpen.value) return;
  if (event.key !== 'Escape') return;
  closeModal();
}

async function handleOk() {
  try {
    if (props.onOk) {
      await props.onOk();
    }
    emit('ok');
    if (props.closeOnOk) {
      closeModal();
    }
  } catch (error) {
    console.error('[ModalCmp] okAction error:', error);
  }
}

function onCancel() {
  emit('cancel');
  closeModal();
}
</script>

<template>
  <Teleport :to="teleportTo">
    <div v-if="isOpen" :id="id" class="modal fade show d-block" tabindex="-1" @keydown="onEscape">
      <div class="modal-backdrop fade show" @click="onBackdropClick" />
      <div :class="dialogClass">
        <div class="modal-content">
          <div class="modal-header" v-if="title || !hideHeaderClose">
            <h5 class="modal-title" v-if="title">{{ title }}</h5>
            <button
              v-if="!hideHeaderClose"
              type="button"
              class="btn-close"
              aria-label="Close"
              @click="closeModal"
            />
          </div>

          <div class="modal-body">
            <slot />
          </div>

          <div class="modal-footer" v-if="cancelText || okText">
            <Btn
              v-if="cancelText"
              :class="cancelClass"
              :color="cancelColor ?? 'secondary'"
              :variant="cancelVariant"
              @click="onCancel"
            >
              {{ cancelText }}
            </Btn>
            <Btn
              v-if="okText"
              :class="okClass"
              :color="okColor ?? 'primary'"
              :variant="okVariant ?? 'solid'"
              @click="handleOk"
            >
              {{ okText }}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
