<!-- src/views/RegisterView.vue -->
<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useChangeHeader } from '../../components/header/useChangeHeader'
import BtnGoogleLogin from '../../components/Btn/BtnGoogleLogin.vue'

useChangeHeader('Registrati')

type Errors = Partial<Record<'name' | 'surname' | 'email' | 'password' | 'confirm' | 'terms', string>>

const form = reactive({
  name: '',
  surname: '',
  email: '',
  password: '',
  confirm: '',
  terms: false,
})

const errors = reactive<Errors>({})
const loading = ref(false)
const created = ref(false)

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}

function validate(): boolean {
  errors.name = form.name.trim() ? '' : 'Il nome è obbligatorio.'
  errors.surname = form.surname.trim() ? '' : 'Il cognome è obbligatorio.'
  errors.email = form.email.trim()
    ? (isValidEmail(form.email.trim()) ? '' : 'Email non valida.')
    : 'L’email è obbligatoria.'
  errors.password = form.password.length >= 8
    ? ''
    : 'La password deve avere almeno 8 caratteri.'
  errors.confirm = form.confirm === form.password
    ? ''
    : 'Le password non coincidono.'
  errors.terms = form.terms ? '' : 'Devi accettare i termini.'

  // ritorna true se TUTTI i messaggi d’errore sono stringa vuota
  return Object.values(errors).every(v => !v)
}

async function onSubmit() {
  if (!validate()) return
  loading.value = true
  // 🚧 Demo: finta chiamata di registrazione
  await new Promise(r => setTimeout(r, 900))
  loading.value = false
  created.value = true
}
</script>

<template>
  <div class="container auth-page  overflow-auto h-100">
    <div class="row justify-content-center">
      <div class="col-12 col-lg-10">
        <div class="auth-hero text-center">
          <div class="auth-hero__badge">🧾</div>
          <h1 class="auth-hero__title">Crea il tuo account</h1>
          <p class="auth-hero__subtitle">
            Un unico profilo per note, debiti condivisi e tornei con gli amici.
          </p>
        </div>
      </div>
    </div>

    <div class="row justify-content-center mt-3">
      <div class="col-12 col-md-10 col-lg-8 col-xxl-6">
        <div class="auth-card">
          <template v-if="!created">
            <h2 class="h4 mb-3 text-center">Registrati</h2>

            <form class="auth-form" @submit.prevent="onSubmit" novalidate>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label" for="name">Nome</label>
                  <div class="input-with-icon">
                    <span class="material-symbols-outlined">badge</span>
                    <input id="name" name="name" type="text" class="form-control" placeholder="Mario"
                      v-model="form.name" :class="{ 'is-invalid': !!errors.name }" autocomplete="given-name" required />
                  </div>
                  <div v-if="errors.name" class="invalid-feedback d-block">{{ errors.name }}</div>
                </div>

                <div class="col-md-6">
                  <label class="form-label" for="surname">Cognome</label>
                  <div class="input-with-icon">
                    <span class="material-symbols-outlined">badge</span>
                    <input id="surname" name="surname" type="text" class="form-control" placeholder="Rossi"
                      v-model="form.surname" :class="{ 'is-invalid': !!errors.surname }" autocomplete="family-name"
                      required />
                  </div>
                  <div v-if="errors.surname" class="invalid-feedback d-block">{{ errors.surname }}</div>
                </div>

                <div class="col-12">
                  <label class="form-label" for="email">Email</label>
                  <div class="input-with-icon">
                    <span class="material-symbols-outlined">mail</span>
                    <input id="email" name="email" type="email" class="form-control" placeholder="nome@esempio.com"
                      v-model="form.email" :class="{ 'is-invalid': !!errors.email }" autocomplete="email" required />
                  </div>
                  <div v-if="errors.email" class="invalid-feedback d-block">{{ errors.email }}</div>
                </div>

                <div class="col-md-6">
                  <label class="form-label" for="password">Password</label>
                  <div class="input-with-icon">
                    <span class="material-symbols-outlined">lock</span>
                    <input id="password" name="password" type="password" class="form-control" placeholder="••••••••"
                      v-model="form.password" :class="{ 'is-invalid': !!errors.password }" autocomplete="new-password"
                      required />
                  </div>
                  <div class="form-text">Minimo 8 caratteri.</div>
                  <div v-if="errors.password" class="invalid-feedback d-block">{{ errors.password }}</div>
                </div>

                <div class="col-md-6">
                  <label class="form-label" for="confirm">Conferma password</label>
                  <div class="input-with-icon">
                    <span class="material-symbols-outlined">lock_reset</span>
                    <input id="confirm" name="confirm" type="password" class="form-control" placeholder="••••••••"
                      v-model="form.confirm" :class="{ 'is-invalid': !!errors.confirm }" autocomplete="new-password"
                      required />
                  </div>
                  <div v-if="errors.confirm" class="invalid-feedback d-block">{{ errors.confirm }}</div>
                </div>

                <div class="col-12">
                  <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="terms" v-model="form.terms"
                      :class="{ 'is-invalid': !!errors.terms }" required />
                    <label class="form-check-label" for="terms">
                      Accetto i <router-link class="auth-link" :to="{ name: 'terms' }">termini e
                        condizioni</router-link>
                    </label>
                  </div>
                  <div v-if="errors.terms" class="invalid-feedback d-block">{{ errors.terms }}</div>
                </div>
              </div>

              <button class="btn btn-primary w-100 mt-3" type="submit" :disabled="loading">
                <span class="material-symbols-outlined align-middle me-1" v-if="!loading">person_add</span>
                <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" v-else />
                {{ loading ? 'Creazione in corso…' : 'Crea account' }}
              </button>
            </form>

            <div class="auth-divider mt-3"><span>oppure</span></div>
            <BtnGoogleLogin class="w-100" />

            <p class="text-center mt-3 mb-0">
              Hai già un account?
              <router-link class="auth-link" :to="{ name: 'login' }">Accedi</router-link>
            </p>
          </template>

          <template v-else>
            <div class="text-center py-3">
              <div class="success-icon mb-2">
                <span class="material-symbols-outlined">check_circle</span>
              </div>
              <h2 class="h5">Account creato!</h2>
              <p class="text-muted mb-3">
                Ora puoi effettuare il login con <strong>{{ form.email }}</strong>.
              </p>
              <div class="d-flex gap-2 justify-content-center">
                <router-link class="btn btn-primary" :to="{ name: 'login' }">
                  Vai al Login
                </router-link>
                <router-link class="btn btn-outline-secondary" :to="{ name: 'home' }">
                  Torna alla Home
                </router-link>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.auth-page {
  padding-top: 1.5rem;
  padding-bottom: 2rem;
}

.auth-hero {
  position: relative;
  padding: 2rem 1.25rem;
  border-radius: 1.25rem;
  background:
    radial-gradient(1200px 500px at 15% -20%, rgba(99, 102, 241, 0.10), transparent 60%),
    radial-gradient(1200px 500px at 110% 120%, rgba(16, 185, 129, 0.10), transparent 60%),
    #ffffff;
  box-shadow:
    0 2px 6px rgba(16, 24, 40, 0.06),
    0 12px 24px rgba(16, 24, 40, 0.06);
}

.auth-hero__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(99, 102, 241, 0.12);
  box-shadow: inset 0 0 0 1px rgba(99, 102, 241, 0.25);
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
}

.auth-hero__title {
  margin: 0.25rem 0;
  font-weight: 700;
}

.auth-hero__subtitle {
  color: #6b7280;
  /* gray-500 */
  margin: 0 auto;
  max-width: 46rem;
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
    padding-left: 2.25rem;
  }
}

.auth-divider {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 1rem 0 0.25rem;

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
  font-size: 0.9rem;
  color: #4f46e5;
}

.auth-link:hover {
  text-decoration: underline;
}

.success-icon {
  display: inline-flex;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  align-items: center;
  justify-content: center;
  background: rgba(16, 185, 129, 0.12);
  box-shadow: inset 0 0 0 1px rgba(16, 185, 129, 0.25);

  .material-symbols-outlined {
    font-size: 28px;
    color: #10b981;
  }
}

@media (min-width: 768px) {
  .auth-card {
    padding: 1.75rem;
  }

  .auth-hero {
    padding: 2.5rem 2rem;
  }
}
</style>
