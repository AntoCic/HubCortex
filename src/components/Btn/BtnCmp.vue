<script setup lang="ts">
import { computed, useSlots, useAttrs } from "vue";
import { useRouter, type RouteLocationRaw } from "vue-router";
import { shareLink, type ShareLink } from "./shareLink";

defineOptions({ inheritAttrs: false });

export type BtnVariant = "solid" | "outline" | "ghost" | "link";
export type BtnColor =
  | "primary" | "secondary" | "success" | "danger"
  | "warning" | "info" | "light" | "dark";

type Icon =
  | "search"
  | "home"
  | "menu"
  | "close"
  | "settings"
  | "send"
  | "add"
  | "remove"
  | "delete"
  | "star"
  | "star_half"
  | "arrow_forward_ios"
  | "arrow_back_ios"
  | "logout"
  | "more_vert"
  | "favorite"
  | "login"
  | "radio_button_unchecked"
  | "radio_button_checked"
  | "bolt"
  | "block"
  | "sync"
  | "share"
  | "ios_share"
  | "upload"
  | "alternate_email"
  | "account_circle"
  | "manage_accounts"
  | "visibility"
  | "visibility_off"
  | "language"
  | "support"
  | "mail"
  | "call"
  | "notifications"
  | "link"
  | "person_search"
  | "edit"
  | "photo_camera"
  | "image"
  | "circle"
  | "payments"
  | "credit_card"
  | "database"
  | "shopping_bag"
  | "account_balance"
  | "savings"
  | "qr_code"
  | "euro"
  | "wallet"
  | "payment_arrow_down"
  | "location_on"
  | "map"
  | "fastfood"
  | string
  ;

const props = defineProps<{
  variant?: BtnVariant;                // default: solid
  color?: BtnColor;                    // default: dark
  size?: "sm" | "lg";
  block?: boolean;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  to?: RouteLocationRaw;            // se presente, naviga con router.push
  loading?: boolean;                // mostra spinner e disabilita
  icon?: Icon;             // Material Symbols outlined name
  share?: ShareLink;             // Material Symbols outlined name
}>();

const emit = defineEmits<{
  (e: "click", ev: MouseEvent): void;
}>();

const slots = useSlots();
const attrs = useAttrs();
const router = useRouter();

const isDisabled = computed(() => !!props.disabled || !!props.loading);

const baseClasses = computed(() => {
  const base = "btn";
  const color = props.color ?? "dark";
  const variant =
    (props.variant ?? "solid") === "solid"
      ? `btn-${color}`
      : `btn-outline-${color}`;
  const border = props.variant === "ghost" ? "border-0" : "";
  const size = props.size ? `btn-${props.size}` : "";
  const block = props.block ? "w-100" : "";
  const link = props.variant === 'link' ? 'btn-ms-link' : ''
  return [base, variant, link, border, size, block].filter(Boolean).join(" ");
});

// Verifica se lo slot default ha contenuto
const hasDefaultSlot = computed(() => !!slots.default?.().length);

// Se non c’è slot e non c’è icon, mostra "error"
const effectiveIcon = computed(() => {
  if (props.icon && props.icon.trim().length > 0) return props.icon.trim();
  if (!hasDefaultSlot.value) return "error";
  return undefined;
});

function onClick(ev: MouseEvent) {
  if (isDisabled.value) {
    ev.preventDefault();
    ev.stopPropagation();
    return;
  }
  emit("click", ev);
  if (props.share) shareLink(props.share);
  if (props.to) {
    // Evita submit se messo dentro un <form>
    if (props.type === "submit") ev.preventDefault();
    ev.stopPropagation();
    router.push(props.to);
  }
}

// Se c'è "to", forziamo un type sicuro per evitare submit involontari
const resolvedType = computed<"button" | "submit" | "reset">(() =>
  props.to ? "button" : (props.type ?? "button")
);
</script>

<template>
  <button v-bind="attrs" :class="[baseClasses, attrs.class]" :type="resolvedType" :disabled="isDisabled"
    :aria-busy="loading || undefined" @click="onClick">
    <!-- loading + icon => spinner al posto dell’icona, testo conservato -->
    <template v-if="loading && effectiveIcon">
      <span class="me-2 d-inline-flex align-middle">
        <span class="spinner-border spinner-border-sm align-middle" role="status" aria-hidden="true"></span>
      </span>
      <slot></slot>
    </template>

    <!-- loading senza icon => solo spinner -->
    <template v-else-if="loading && !effectiveIcon">
      <span class="spinner-border spinner-border-sm align-middle" role="status" aria-hidden="true"></span>
      <span class="visually-hidden">Loading…</span>
    </template>

    <!-- stato normale -->
    <template v-else>
      <span v-if="effectiveIcon" :class="`${hasDefaultSlot ? 'me-2 ' : ''}d-inline-flex align-middle`">
        <span class="material-symbols-outlined" aria-hidden="true">{{ effectiveIcon }}</span>
      </span>
      <slot></slot>
    </template>
  </button>
</template>

<style scoped lang="scss">
.spinner-border {
  vertical-align: middle;
}

.btn-ms-link {
  background-color: transparent !important;
  border: none;
  color: var(--bs-btn-color) !important;

  &:hover {
    text-decoration: underline;
  }
}

.hideAfter::after {
  display: none;
}
</style>
