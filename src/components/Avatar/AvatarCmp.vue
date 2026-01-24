<script setup lang="ts">
import { computed } from 'vue'

type NamedSize = 'sm' | 'md' | 'lg' | 'xl'
type Shape = 'square' | 'circle' | 'octagon'

interface Props {
  imgUrl?: string | null
  initials?: string
  /** 'sm'|'md'|'lg'|'xl' o un number (px) */
  size?: NamedSize | number
  /** Forma del contenitore */
  shape?: Shape
  /** Se presente, mostra questa icona centrata invece di img/initials (es. un componente icona) */
  icon?: any
  /** Tooltip/aria opzionale */
  title?: string
}
const props = withDefaults(defineProps<Props>(), {
  imgUrl: null,
  initials: '',
  size: 'md',
  shape: 'circle',
  title: '',
})

/** px dalla taglia nominale */
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

const shapeClass = computed(() => {
  switch (props.shape) {
    case 'square': return 'shape--square'
    case 'octagon': return 'shape--octagon'
    case 'circle':
    default: return 'shape--circle'
  }
})
</script>

<template>
  <!-- Tutti gli attributi passati dal parent vengono applicati al root div -->
  <div
    class="avatar-display"
    :class="shapeClass"
    :style="{ width: `${pxSize}px`, height: `${pxSize}px` }"
    :title="title || undefined"
    role="img"
    v-bind="$attrs"
  >
    <!-- 1) ICON (se presente, ha precedenza) -->
    <component
      v-if="icon"
      :is="icon"
      class="centered"
      :style="{ fontSize: `${Math.max(16, pxSize/2.4)}px` }"
      aria-hidden="true"
    />

    <!-- 2) IMG -->
    <img
      v-else-if="imgUrl"
      :src="imgUrl"
      alt=""
      class="avatar-img"
      draggable="false"
    />

    <!-- 3) INITIALS -->
    <div
      v-else-if="initials"
      class="avatar-initials centered"
      :style="{ fontSize: `${Math.max(12, pxSize/3)}px` }"
    >
      {{ initials }}
    </div>

    <!-- 4) PLACEHOLDER -->
    <div v-else class="avatar-placeholder centered">—</div>
  </div>
</template>

<style scoped>
.avatar-display {
  position: relative;
  overflow: hidden;
  user-select: none;
  border: 1px solid var(--border, #e5e7eb);
  background: #f3f4f6;
  /* permette al parent di aggiungere classi: es. hover, cursor, ecc. */
}

/* forme */
.shape--circle { border-radius: 999px; }
.shape--square { border-radius: 0; }
.shape--octagon {
  /* ottagono con lati diagonali metà dei lati ortogonali (offset ~25%) */
  clip-path: polygon(
    25% 0%,
    75% 0%,
    100% 25%,
    100% 75%,
    75% 100%,
    25% 100%,
    0% 75%,
    0% 25%
  );
}

/* immagine */
.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* contenuti centrati (icone/iniziali/placeholder) */
.centered {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
}

.avatar-initials {
  color: #374151;
  background: #f9fafb;
  font-weight: 600;
}

.avatar-placeholder {
  color: #9ca3af;
  background: #f9fafb;
  font-weight: 500;
  border: 1px dashed #e5e7eb;
}
</style>
