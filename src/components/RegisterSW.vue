<script setup lang="ts">
import { registerSW } from 'virtual:pwa-register'
import ModalCmp from './Modal/ModalCmp.vue'
import { toast } from './toast/toastController'
import { store } from '../stores/store'
import { pushMsg } from './notification/pushMsg'


const updateSW = registerSW({
    immediate: true,

    onRegisteredSW(_: string, registration: ServiceWorkerRegistration | undefined) {
        pushMsg.reg = registration;
    },

    onNeedRefresh() {
        toast.info('🔁 È disponibile una nuova versione dell’app!')
        store.pwaUpdateModal = 'update';
    },

    onOfflineReady() {
        toast.warning('📦 Tutti gli asset sono disponibili offline.')
    },

    onRegisterError(err) {
        console.log('❌ Errore durante la registrazione del SW:', err)
        toast.error('❌ Errore durante la registrazione del SW')
    },
})



function onClickOk() {
    updateSW(true);
    window.location.reload();
    store.pwaUpdateModal = false
}
function onClickCancel() {
    toast.info('Al prossimo refresh sarà disponibile la nuova versione')
    store.pwaUpdateModal = false
}

const currentVersion = (store as any)?.currentVersion ?? null
const availableVersion = (store as any)?.availableVersion ?? null
</script>

<template>
    <ModalCmp :model-value="!!store.pwaUpdateModal"
        :title="store.pwaUpdateModal === 'update' ? '🔁 Nuovo aggiornamento' : '⚡ Forza aggiornamento'"
        backdrop="static" ok-text="Ricarica ora" cancel-text="Non ora" centered @ok="onClickOk"
        @close="() => (store.pwaUpdateModal = false)" @cancel="onClickCancel">
        <div class="pwa-modal">
            <div class="pwa-modal__hero">
                <div class="pwa-modal__icon">
                    <span class="material-symbols-outlined">system_update</span>
                </div>
                <h3 class="pwa-modal__title">
                    {{ store.pwaUpdateModal === 'update'
                        ? 'Nuova versione disponibile'
                        : 'Vuoi forzare l’aggiornamento?' }}
                </h3>
                <p class="pwa-modal__subtitle">
                    {{
                        store.pwaUpdateModal === 'update'
                            ? 'Per applicare le ultime novità è necessario ricaricare l’app.'
                            : 'Avvieremo un controllo, scaricheremo (se presente) e ricaricheremo.'
                    }}
                </p>

                <!-- Badge versione (opzionali) -->
                <div v-if="currentVersion || availableVersion" class="pwa-modal__versions">
                    <span v-if="currentVersion" class="chip chip--muted" title="Versione corrente">
                        <span class="dot dot--muted"></span> v{{ currentVersion }}
                    </span>
                    <span v-if="availableVersion" class="chip chip--success" title="Versione disponibile">
                        <span class="dot dot--success"></span> v{{ availableVersion }}
                    </span>
                </div>
            </div>

            <!-- Change log slot opzionale (se vuoi passarci contenuti dinamici un giorno) -->
            <div class="pwa-modal__panel">
                <slot name="changelog">
                    <ul class="pwa-modal__list">
                        <li>Miglioramenti di stabilità e performance</li>
                        <li>Fix minori all’interfaccia</li>
                    </ul>
                </slot>
            </div>

            <div class="pwa-modal__hint">
                <span class="kbd">⌘R</span>/<span class="kbd">Ctrl</span>+<span class="kbd">R</span> per ricaricare in
                futuro
            </div>
        </div>
    </ModalCmp>
</template>

<style scoped lang="scss">
.pwa-modal {
    display: grid;
    gap: 1rem;
}

.pwa-modal__hero {
    text-align: center;
    padding: 0.5rem 0 0.25rem;
    position: relative;
    isolation: isolate;

    &::before {
        content: '';
        position: absolute;
        inset: -1rem -1rem auto -1rem;
        height: 120px;
        background:
            radial-gradient(800px 200px at 20% 0%, rgba(99, 102, 241, 0.12), transparent 60%),
            radial-gradient(800px 200px at 80% 0%, rgba(16, 185, 129, 0.12), transparent 60%);
        z-index: -1;
    }
}

.pwa-modal__icon {
    width: 64px;
    height: 64px;
    margin: 0 auto 0.5rem;
    border-radius: 18px;
    display: grid;
    place-items: center;
    color: #4f46e5;
    /* indigo-600 */
    background: conic-gradient(from 180deg at 50% 50%, rgba(79, 70, 229, 0.12), rgba(16, 185, 129, 0.16));
    box-shadow: inset 0 0 0 1px rgba(79, 70, 229, 0.22);
    animation: float 3.6s ease-in-out infinite;

    .material-symbols-outlined {
        font-size: 30px;
        line-height: 1;
    }
}

.pwa-modal__title {
    margin: 0.25rem 0 0.25rem;
    font-weight: 700;
    font-size: 1.25rem;
}

.pwa-modal__subtitle {
    margin: 0 auto 0;
    max-width: 46ch;
    color: #6b7280;
    /* gray-500 */
}

.pwa-modal__versions {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    margin-top: 0.75rem;
}

.chip {
    --bg: #eef2ff;
    --fg: #3730a3;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.25rem 0.6rem;
    border-radius: 999px;
    font-size: 0.85rem;
    background: var(--bg);
    color: var(--fg);
    border: 1px solid rgba(0, 0, 0, 0.06);

    &--muted {
        --bg: #f3f4f6;
        /* gray-100 */
        --fg: #374151;
        /* gray-700 */
    }

    &--success {
        --bg: #ecfdf5;
        /* emerald-50 */
        --fg: #065f46;
        /* emerald-800 */
    }
}

.dot {
    width: 8px;
    height: 8px;
    border-radius: 999px;

    &--muted {
        background: #9ca3af;
    }

    /* gray-400 */
    &--success {
        background: #10b981;
    }

    /* emerald-500 */
}

.pwa-modal__panel {
    border: 1px solid rgba(99, 102, 241, 0.18);
    background: linear-gradient(180deg, rgba(99, 102, 241, 0.04), rgba(16, 185, 129, 0.04));
    border-radius: 12px;
    padding: 0.9rem 1rem;
}

.pwa-modal__list {
    margin: 0.25rem 0 0;
    padding-left: 1rem;

    li {
        margin: 0.25rem 0;
    }
}

.pwa-modal__hint {
    text-align: center;
    color: #6b7280;
    font-size: 0.9rem;
    margin-top: 0.25rem;

    .kbd {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
        font-size: 0.85em;
        padding: 0.15rem 0.4rem;
        border-radius: 6px;
        border: 1px solid #e5e7eb;
        background: #f9fafb;
        box-shadow: inset 0 -1px 0 #e5e7eb;
        margin: 0 2px;
        display: inline-block;
    }
}

@keyframes float {

    0%,
    100% {
        transform: translateY(0)
    }

    50% {
        transform: translateY(-3px)
    }
}
</style>
