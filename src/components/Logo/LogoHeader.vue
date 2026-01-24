<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute, useRouter, type RouteLocationRaw } from 'vue-router';
import { store } from '../../stores/store';

const props = withDefaults(defineProps<{
    loading?: boolean
    backTo?: RouteLocationRaw
    size?: 'sm' | 'md' | 'lg'
}>(), {
    size: 'lg'
})

const route = useRoute();
const router = useRouter();

const isHovering = ref(false);
const isHome = computed(() => route.name === 'home');
const showBackArrow = computed(() => !isHome.value && isHovering.value);

function handleClick() {
    if (isHome.value) {
        window.location.reload();
    } else {
        if (props.backTo !== undefined) {
            router.push(props.backTo)
        } else {
            router.back();
        }
    }
}

function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick();
    }
}
</script>

<template>
    <div class="logo-wrapper" :class="`size-${props.size}`" role="button" tabindex="0"
        :aria-label="isHome ? 'Ricarica la home' : 'Torna indietro'" @click="handleClick" @keydown="onKeydown"
        @mouseenter="isHovering = true" @mouseleave="isHovering = false">
        <img v-if="showBackArrow" :src="store.HEADER.logoUrl" alt="logo" class="logo-app logo-shadows"
            :class="{ 'is-loading': !!props.loading, 'square': store.HEADER.logoShape === 'square', 'circle': store.HEADER.logoShape === 'circle', 'octagon': store.HEADER.logoShape === 'octagon' }" />
        <img v-else :src="store.HEADER.logoUrl" alt="logo" class="logo-app logo-shadows"
            :class="{ 'is-loading': !!props.loading, 'square': store.HEADER.logoShape === 'square', 'circle': store.HEADER.logoShape === 'circle', 'octagon': store.HEADER.logoShape === 'octagon' }" />
    </div>
</template>

<style lang="scss" scoped>
.logo-wrapper {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    transition: transform 200ms ease;

    &:active {
        transform: scale(0.98);
    }

    /* =====================
     SIZE VARIANTS
     ===================== */
    &.size-lg {
        width: 6em;
    }

    &.size-md {
        width: 4.5em;
    }

    &.size-sm {
        width: 3em;
    }

    /* =====================
     SHAPES
     ===================== */
    .square {
        border-radius: 0;
    }

    .circle {
        border-radius: 50%;
    }

    .octagon {
        clip-path: polygon(25% 0%,
                75% 0%,
                100% 25%,
                100% 75%,
                75% 100%,
                25% 100%,
                0% 75%,
                0% 25%);
        border-radius: 0;
    }
}

.logo-app {
    inline-size: auto;
    display: block;
}

/* Altezza logo per size */
.logo-wrapper.size-lg .logo-app {
    height: 6em;
}

.logo-wrapper.size-md .logo-app {
    height: 4.5em;
}

.logo-wrapper.size-sm .logo-app {
    height: 3em;
}

/* =====================
   MOBILE
   ===================== */
@media (max-width: 576px) {
    .logo-wrapper.size-lg {
        width: 3em;
    }

    .logo-wrapper.size-md {
        width: 2.5em;
    }

    .logo-wrapper.size-sm {
        width: 2em;
    }

    .logo-wrapper.size-lg .logo-app {
        height: 3em;
    }

    .logo-wrapper.size-md .logo-app {
        height: 2.5em;
    }

    .logo-wrapper.size-sm .logo-app {
        height: 2em;
    }
}

/* =====================
   OMBRA LOGO
   ===================== */
.logo-shadows {
    will-change: filter;
    transition: filter 300ms;

    &:hover {
        filter: drop-shadow(0 0 2em rgba(45, 198, 129, 0.3));
    }
}

/* =====================
   LOADING
   ===================== */
.is-loading {
    animation: blink 0.8s linear infinite;
}

@keyframes blink {
    0% {
        opacity: 0.9;
    }

    50% {
        opacity: 0.25;
    }

    100% {
        opacity: 0.9;
    }
}

/* =====================
   ACCESSIBILITY
   ===================== */
@media (prefers-reduced-motion: reduce) {
    .logo-wrapper {
        transition: none;
    }

    .logo-shadows {
        transition: none;
    }

    .is-loading {
        animation: none;
    }
}
</style>
