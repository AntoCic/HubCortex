<script setup lang="ts">
import { ref } from 'vue'
import { toast } from '../toast/toastController';
import { store } from '../../stores/store';

const checking = ref(false)

async function checkForUpdates() {
    checking.value = true
    try {
        const reg = await navigator.serviceWorker.getRegistration()
        if (!reg) {
            toast.warning('ℹ️ Nessun Service Worker registrato')
            return
        }

        await reg.update();
        await new Promise((r) => setTimeout(r, 2000))

        if (store.pwaUpdateModal === false) {
            toast.success('Sei già all’ultima versione')
            store.pwaUpdateModal = 'force'
        }
    } catch (e) {
        console.error(e)
        toast.error('Errore durante il controllo aggiornamenti')
    } finally {
        checking.value = false
    }
}

</script>

<template>
    <button class="btn-pwa-update" :disabled="checking" @click="checkForUpdates">
        <p class="btn-pwa-text">
            <span style="--index: 0;">C</span>
            <span style="--index: 1;">H</span>
            <span style="--index: 2;">E</span>
            <span style="--index: 3;">C</span>
            <span style="--index: 4;">K</span>
            <span style="--index: 5;"> </span>
            <span style="--index: 6;">F</span>
            <span style="--index: 7;">O</span>
            <span style="--index: 8;">R</span>
            <span style="--index: 9;"> </span>
            <span style="--index: 10;">U</span>
            <span style="--index: 11;">P</span>
            <span style="--index: 12;">D</span>
            <span style="--index: 13;">A</span>
            <span style="--index: 14;">T</span>
            <span style="--index: 15;">E</span>
            <span style="--index: 16;">S</span>
        </p>

        <div class="btn-pwa-circle">
            <template v-if="!checking">
                <svg viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg" class="btn-pwa-icon" width="14">
                    <path
                        d="M13.376 11.552l-.264-10.44-10.44-.24.024 2.28 6.96-.048L.2 12.56l1.488 1.488 9.432-9.432-.048 6.912 2.304.024z"
                        fill="currentColor"></path>
                </svg>

                <svg viewBox="0 0 14 15" fill="none" width="14" xmlns="http://www.w3.org/2000/svg"
                    class="btn-pwa-icon btn-pwa-icon-copy">
                    <path
                        d="M13.376 11.552l-.264-10.44-10.44-.24.024 2.28 6.96-.048L.2 12.56l1.488 1.488 9.432-9.432-.048 6.912 2.304.024z"
                        fill="currentColor"></path>
                </svg>
            </template>
            <div v-else class="spinner-border spinner-border-sm" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>
    </button>

</template>

<style lang="scss" scoped>
.btn-pwa-update {
    cursor: pointer;
    border: none;
    background: #7808d0;
    color: #fff;
    width: 80px;
    height: 80px;
    border-radius: 50%;
    overflow: hidden;
    position: relative;
    display: grid;
    place-content: center;
    transition:
        background 300ms,
        transform 200ms;
    font-weight: 600;

    .btn-pwa-text {
        position: absolute;
        inset: 0;
        animation: text-rotation 8s linear infinite;
        margin-bottom: 0;

        >span {
            position: absolute;
            transform: rotate(calc(18deg * var(--index)));
            inset: 2px;
        }
    }

    .btn-pwa-circle {
        position: relative;
        width: 32px;
        height: 32px;
        overflow: hidden;
        background: #fff;
        color: #7808d0;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .btn-pwa-icon-copy {
        position: absolute;
        transform: translate(-150%, 150%);
    }

    &:hover {
        background: #000;
        transform: scale(1.05);
    }

    &:hover .btn-pwa-icon,
    &:hover .spinner-border {
        color: #000;
    }

    &:hover .btn-pwa-icon:first-child {
        transition: transform 0.3s ease-in-out;
        transform: translate(150%, -150%);
    }

    &:hover .btn-pwa-icon-copy {
        transition: transform 0.3s ease-in-out 0.1s;
        transform: translate(0);
    }

    @keyframes text-rotation {
        to {
            rotate: 360deg;
        }
    }
}
</style>
