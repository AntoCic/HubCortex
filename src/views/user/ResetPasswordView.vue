<!-- src/views/ResetPasswordView.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { useChangeHeader } from '../../components/header/useChangeHeader'

useChangeHeader('Reset password')

const email = ref('')
const loading = ref(false)
const sent = ref(false)
const errorMsg = ref<string | null>(null)

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}

async function onSubmit() {
  errorMsg.value = null

  if (!email.value.trim()) {
    errorMsg.value = 'Inserisci la tua email.'
    return
  }
  if (!isValidEmail(email.value.trim())) {
    errorMsg.value = 'Formato email non valido.'
    return
  }

  // 🚧 Demo only: finta chiamata di reset
  loading.value = true
  await new Promise((r) => setTimeout(r, 900))
  loading.value = false
  sent.value = true
}
</script>

<template>
  <div class="container auth-page  overflow-auto h-100">
    <div class="row justify-content-center">
      <div class="col-12 col-lg-10">
        <div class="auth-hero text-center">
          <div class="auth-hero__badge">🧩</div>
          <h1 class="auth-hero__title">Hai dimenticato la password?</h1>
          <p class="auth-hero__subtitle">
            Inserisci la tua email per ricevere un link di ripristino.
          </p>
        </div>
      </div>
    </div>

    <div class="row justify-content-center mt-3">
      <div class="col-12 col-md-8 col-lg-6">
        <div class="auth-card">
          <template v-if="!sent">
            <h2 class="h4 mb-3 text-center">Invia link di reset</h2>

            <form class="auth-form" @submit.prevent="onSubmit" novalidate>
              <div class="mb-3">
                <label class="form-label" for="email">Email</label>
                <div class="input-with-icon">
                  <span class="material-symbols-outlined">mail</span>
                  <input id="email" name="email" type="email" class="form-control" placeholder="nome@esempio.com"
                    autocomplete="email" v-model="email" :disabled="loading" required
                    :class="{ 'is-invalid': !!errorMsg }" aria-describedby="emailHelp" aria-invalid="true" />
                </div>
                <div v-if="errorMsg" class="invalid-feedback d-block">{{ errorMsg }}</div>
                <div id="emailHelp" class="form-text">
                  Ti invieremo un link per reimpostare la password.
                </div>
              </div>

              <button class="btn btn-primary w-100" type="submit" :disabled="loading">
                <span class="material-symbols-outlined align-middle me-1" v-if="!loading">mail_lock</span>
                <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" v-else />
                {{ loading ? 'Invio in corso…' : 'Invia link' }}
              </button>

              <div class="text-center mt-3">
                <router-link class="auth-link" :to="{ name: 'login' }">
                  Torna al login
                </router-link>
              </div>
            </form>
          </template>

          <template v-else>
            <div class="text-center py-3">
              <div class="success-icon mb-2">
                <span class="material-symbols-outlined">check_circle</span>
              </div>
              <h2 class="h5">Email inviata!</h2>
              <p class="text-muted mb-3">
                Se l’indirizzo <strong>{{ email }}</strong> è registrato, riceverai a breve un link per reimpostare la
                password.
              </p>
              <div class="d-flex gap-2 justify-content-center">
                <router-link class="btn btn-outline-secondary" :to="{ name: 'login' }">
                  Vai al Login
                </router-link>
                <button class="btn btn-light" type="button" @click="sent = false">
                  Invia di nuovo
                </button>
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
