<script setup lang="ts">
import { useChangeHeader } from '../../components/header/useChangeHeader';
import BtnGoogleLogin from '../../components/Btn/BtnGoogleLogin.vue';
import { computed, ref } from 'vue';

useChangeHeader('Login', '/');

const showLogin = ref<boolean>(false)
const adminCode = ref<string>('')
const adminCodeTouched = ref(false)

const isAdminCodeValid = computed(() => adminCode.value.trim() === '5555') // non sei nascosto perche se logghi non puoi fare niente lo stesso perche non hai permessi

function submitAdminCode() {
    adminCodeTouched.value = true
    if (isAdminCodeValid.value) {
        showLogin.value = true
    }
}
</script>

<template>
    <!-- sostituisci il contenuto del <template> -->
    <div class="container auth-page overflow-auto h-100">
        <div class="row justify-content-center mt-3" v-if="showLogin">
            <div class="col-12 col-md-8 col-lg-6">
                <div class="auth-card">
                    <p class="mb-2 text-center fw-bold fs-1">🔐</p>
                    <p class="mb-2 text-center fw-bold fs-2">Benvenuto!</p>
                    <h2 class="h4 mb-3 text-center">Accedi al tuo account</h2>

                    <form @submit.prevent>
                        <div class="mb-3">
                            <label class="form-label" for="email">Email</label>
                            <div class="input-with-icon">
                                <span class="material-symbols-outlined">mail</span>
                                <input id="email" name="email" type="email" class="form-control"
                                    placeholder="nome@esempio.com" autocomplete="email" required />
                            </div>
                        </div>

                        <div class="mb-2">
                            <label class="form-label" for="password">Password</label>
                            <div class="input-with-icon">
                                <span class="material-symbols-outlined">lock</span>
                                <input id="password" name="password" type="password" class="form-control"
                                    placeholder="••••••••" autocomplete="current-password" required />
                            </div>
                        </div>

                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="remember" name="remember" />
                                <label class="form-check-label" for="remember">Ricordami</label>
                            </div>
                            <router-link class="auth-link" :to="{ name: 'reset-password' }">Password
                                dimenticata?</router-link>
                        </div>

                        <button class="btn btn-primary w-100 mb-3" type="submit">
                            Accedi
                        </button>
                    </form>

                    <div class="auth-divider"><span>oppure</span></div>

                    <BtnGoogleLogin class="w-100" />
                    <p class="text-center mt-3 mb-0">
                        Non hai un account?
                        <router-link class="auth-link" :to="{ name: 'register' }">Registrati</router-link>
                    </p>
                </div>
            </div>
        </div>
        <div class="row justify-content-center mt-3" v-else>
            <div class="col-12 col-md-10 col-lg-8">
                <div class="auth-card auth-info">
                    <div class="d-flex align-items-start gap-3">
                        <div class="auth-badge">
                            <span class="material-symbols-outlined">admin_panel_settings</span>
                        </div>

                        <div class="flex-grow-1">
                            <h2 class="h4 mb-2">Area riservata</h2>
                            <p class="text-muted mb-3">
                                Il login è attualmente disponibile solo per gli <strong>amministratori</strong> del
                                sito.
                                Se sei un admin, inserisci il codice per sbloccare il form di accesso.
                            </p>

                            <form class="row g-2 align-items-end" @submit.prevent="submitAdminCode">
                                <div class="col col-sm-6 col-md-5 col-lg-4">
                                    <label class="form-label" for="adminCode">Codice amministratore</label>

                                    <div class="input-with-icon">
                                        <span class="material-symbols-outlined">key</span>
                                        <input id="adminCode" v-model="adminCode" name="adminCode" inputmode="numeric"
                                            class="form-control" placeholder="Inserisci il codice"
                                            autocomplete="one-time-code" @blur="adminCodeTouched = true" />
                                    </div>
                                </div>
                                <div class="col-auto">
                                    <button class="btn btn-primary" type="submit"
                                        :disabled="adminCode.trim().length === 0">
                                        Sblocca login
                                    </button>
                                </div>
                                <div class="col-12">
                                    <div v-if="adminCodeTouched && adminCode.trim().length > 0 && !isAdminCodeValid"
                                        class="auth-hint auth-hint--danger mt-2">
                                        Codice non valido. Riprova.
                                    </div>

                                    <div v-else class="auth-hint mt-2">
                                        Se non sei amministratore, contatta chi gestisce il sito.
                                    </div>
                                </div>
                            </form>

                            <div class="auth-divider my-3"><span>info</span></div>

                            <ul class="auth-list mb-0">
                                <li>
                                    <span class="material-symbols-outlined">lock</span>
                                    Accesso protetto per evitare registrazioni non autorizzate.
                                </li>
                                <li>
                                    <span class="material-symbols-outlined">shield</span>
                                    Solo gli admin possono creare e gestire i dati del sistema.
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    </div>

</template>
<style lang="scss" scoped>
/* aggiungi nel tuo <style lang="scss" scoped> */
.auth-page {
    padding-top: 1.5rem;
    padding-bottom: 2rem;
}

.auth-card {
    background: #fff;
    border-radius: 1rem;
    padding: 1.25rem;
    box-shadow:
        0 2px 6px rgba(16, 24, 40, 0.06),
        0 12px 24px rgba(16, 24, 40, 0.06);
}

.input-with-icon {
    position: relative;

    .material-symbols-outlined {
        position: absolute;
        left: 0.75rem;
        top: 50%;
        transform: translateY(-50%);
        pointer-events: none;
        opacity: 0.7;
    }

    .form-control {
        padding-left: 2.5rem;
    }
}

.auth-divider {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin: 0.75rem 0 0.25rem;

    &::before,
    &::after {
        content: '';
        flex: 1;
        height: 1px;
        background: rgba(0, 0, 0, 0.08);
    }

    span {
        font-size: 0.875rem;
        color: #6b7280;
        user-select: none;
    }
}

.auth-link {
    text-decoration: none;
    font-size: 0.875rem;
    color: #4f46e5;
    /* indigo-600 */
}

.auth-link:hover {
    text-decoration: underline;
}

@media (min-width: 768px) {
    .auth-card {
        padding: 1.75rem;
    }
}

.auth-info {
    border: 1px solid rgba(79, 70, 229, 0.12);
    background: linear-gradient(180deg, rgba(79, 70, 229, 0.06), rgba(255, 255, 255, 1));
}

.auth-badge {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: grid;
    place-items: center;
    background: rgba(79, 70, 229, 0.12);
    color: #4f46e5;

    .material-symbols-outlined {
        font-size: 22px;
    }
}

.auth-hint {
    font-size: 0.875rem;
    color: #6b7280;
}

.auth-hint--danger {
    color: #b42318;
}

.auth-list {
    list-style: none;
    padding: 0;
    margin: 0;

    li {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        padding: 0.35rem 0;
        color: #374151;

        .material-symbols-outlined {
            font-size: 18px;
            opacity: 0.8;
        }
    }
}
</style>