<!-- src/views/NotifyTestView.vue -->
<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { pushMsg } from '../../notification/pushMsg'
import { currentUserStore } from '../../../stores/currentUserStore'
import { userPublicStore } from '../../../stores/userPublicStore'
import AccordionCmp from '../../Accordion/AccordionCmp.vue'

const permission = ref<NotificationPermission>(pushMsg.permission)
async function askPermission() {
  const p = await pushMsg.askPermission()
  permission.value = p
}

const form = reactive({
  toUid: !!currentUserStore.uid ? currentUserStore.uid : '',
  title: '🔔 test',
  body: '',
  url: '/',
  icon: '/img/logo/pwa.png',
  silent: false,
})

const users = computed(() => userPublicStore.itemsArray)

onMounted(async () => {
  if (currentUserStore.isLoggedIn) {
    await userPublicStore.get()
  }
})

const isValid = computed(() => !!form.toUid && (form.title.trim().length > 0 || form.body.trim().length > 0))

const quickEmojis = ['💸', '✅', '⚠️', '🚨', '🔔', '🎉', '📣', '📝']

function appendEmoji(e: string) {
  if (!form.body.includes(e)) form.body = `${e} ${form.body}`.trim()
}

const selectedUser = computed(() => userPublicStore.items[form.toUid])

// Invio
const sending = ref(false)
const sentOK = ref<null | boolean>(null)
const errorMsg = ref<string | null>(null)

async function sendTest() {
  errorMsg.value = null
  sentOK.value = null

  if (!isValid.value) {
    errorMsg.value = 'Compila almeno il titolo o il corpo della notifica.'
    return
  }
  if (permission.value !== 'granted') {
    errorMsg.value = 'Le notifiche non sono abilitate su questo dispositivo.'
    return
  }

  try {
    sending.value = true
    const ok = await pushMsg.sendTo(form.toUid, {
      title: form.title.trim() || '🔔',
      body: form.body.trim(),
      icon: form.icon || '/img/logo/pwa.png',
      data: { url: form.url || '/' },
      silent: form.silent,
    })
    sentOK.value = ok
    if (ok) {
      // Reset soft del body, tengo il titolo
      form.body = ''
    } else {
      errorMsg.value = 'Impossibile inviare la notifica (token non presente o utente non raggiungibile).'
    }
  } catch (e: any) {
    errorMsg.value = e?.message ?? 'Errore imprevisto durante l’invio.'
    sentOK.value = false
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <div class="container py-4">
    <div class="row justify-content-center">
      <div class="col-12 col-lg-8">
        <div class="card notify-card shadow-lg text-light">
          <div class="card-header d-flex align-items-center justify-content-between">
            <div class="d-flex align-items-center gap-3">
              <div class="avatar-frame">
                <img v-if="selectedUser?.photoURL" :src="selectedUser?.photoURL" :alt="selectedUser?.fullName" />
                <div v-else class="avatar-fallback">
                  {{ (selectedUser?.name ?? 'U')[0] }}{{ (selectedUser?.surname ?? 'U')[0] ?? '' }}
                </div>
              </div>
              <div>
                <h5 class="mb-0">Invia notifica</h5>
                <small class="text-muted-weak">
                  A: <strong>{{ selectedUser?.fullName }}</strong>
                </small>
              </div>
            </div>

            <div>
              <p class="mb-0 fs-8">Permission:</p>
              <span class="badge" :class="{
                'bg-success-subtle text-success-emphasis': permission === 'granted',
                'bg-warning-subtle text-warning-emphasis': permission === 'default',
                'bg-danger-subtle text-danger-emphasis': permission === 'denied',
              }">
                {{ permission }}
              </span>
              <button v-if="permission !== 'granted'" class="btn btn-sm btn-outline-light ms-2" @click="askPermission">
                Abilita
              </button>
            </div>
          </div>

          <div class="card-body">
            <!-- Destinatario -->
            <div class="mb-3">
              <label class="form-label">Destinatario</label>

              <select v-model="form.toUid" class="form-select">
                <option v-for="u in users" :key="u.id" :value="u.id">
                  {{ u.fullName }} — {{ u.id }}
                </option>
              </select>
            </div>

            <!-- Corpo -->
            <div class="mb-1">
              <label class="form-label">Messaggio (opzionale)</label>
              <textarea v-model="form.body" rows="3" class="form-control"
                placeholder="Es. Ciao! Questo è un test 👋"></textarea>
            </div>

            <!-- Quick emojis -->
            <div class="mb-3">
              <div class="d-flex flex-wrap gap-2 align-items-center">
                <button v-for="e in quickEmojis" :key="e" type="button" class="btn btn-sm btn-emoji"
                  @click="appendEmoji(e)">{{ e }}</button>
              </div>
            </div>

            <AccordionCmp title="• Altro" class="mt-3">
              <!-- Titolo -->
              <div class="mb-3">
                <label class="form-label">Titolo</label>
                <input v-model="form.title" type="text" class="form-control" placeholder="Es. 🔔 Notifica di test" />
              </div>

              <div class="row g-3">
                <!-- URL -->
                <div class="col-12 col-md-6">
                  <label class="form-label">URL (tap-notification)</label>
                  <input v-model="form.url" type="text" class="form-control" placeholder="/ oppure /qualcosa" />
                </div>

                <!-- Icon -->
                <div class="col-12 col-md-6">
                  <label class="form-label">Icona</label>
                  <input v-model="form.icon" type="text" class="form-control" placeholder="/img/logo/pwa.png" />
                </div>
              </div>

              <!-- Silent -->
              <div class="form-check form-switch mt-3">
                <input class="form-check-input" type="checkbox" id="silentSwitch" v-model="form.silent" />
                <label class="form-check-label" for="silentSwitch">Invia come <strong>silenziosa</strong></label>
              </div>
            </AccordionCmp>

            <!-- Alert / esito -->
            <div v-if="errorMsg" class="alert alert-danger mt-3 mb-0" role="alert">
              {{ errorMsg }}
            </div>
            <div v-else-if="sentOK === true" class="alert alert-success mt-3 mb-0" role="alert">
              Notifica inviata correttamente ✅
            </div>
            <div v-else-if="sentOK === false" class="alert alert-warning mt-3 mb-0" role="alert">
              Notifica non inviata. Riprova o verifica i token FCM.
            </div>

          </div>

          <div class="card-footer d-flex justify-content-end gap-2">
            <button class="btn btn-outline-secondary" type="button" @click="form.body = ''">
              Pulisci messaggio
            </button>
            <button class="btn btn-primary btn-glow" :disabled="!isValid || sending" @click="sendTest">
              <span v-if="sending" class="spinner-border spinner-border-sm me-2" role="status"
                aria-hidden="true"></span>
              Invia notifica
            </button>
          </div>
        </div>

        <!-- Mini preview -->
        <div class="notification-preview mt-4">
          <div class="np-icon">
            <img :src="form.icon || '/img/logo/pwa.png'" alt="icon" />
          </div>
          <div class="np-content">
            <div class="np-title">{{ form.title || 'Titolo' }}</div>
            <div class="np-body text-muted-weak">{{ form.body || 'Anteprima messaggio…' }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.text-muted-weak {
  color: rgba(255, 255, 255, 0.7) !important;
}

.card.notify-card {
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: linear-gradient(180deg, rgba(20, 20, 25, 0.9) 0%, rgba(16, 16, 20, 0.8) 100%);
  backdrop-filter: blur(6px);

  .card-header {
    background: rgba(255, 255, 255, 0.04);
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }

  .card-footer {
    background: rgba(255, 255, 255, 0.04);
    border-top: 1px solid rgba(255, 255, 255, 0.06);
  }
}

/* Avatar */
.avatar-frame {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.25);
  background: rgba(255, 255, 255, 0.06);
  display: grid;
  place-items: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .avatar-fallback {
    font-weight: 700;
    color: rgba(255, 255, 255, 0.85);
  }
}

/* Input ghost prepend */
.input-group-text--ghost {
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.75);
  border-color: rgba(255, 255, 255, 0.12);
}

/* Emoji chip */
.btn-emoji {
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #fff;
  padding: 0.25rem 0.5rem;
  backdrop-filter: blur(3px);

  &:hover {
    background: rgba(255, 255, 255, 0.12);
  }
}

/* Pulsante glow */
.btn-glow {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.15);

  &::after {
    content: "";
    position: absolute;
    inset: -2px;
    background: radial-gradient(600px circle at var(--x, 50%) var(--y, 50%), rgba(255, 255, 255, 0.12), transparent 35%);
    opacity: 0;
    transition: opacity .25s ease;
  }

  &:hover::after {
    opacity: 1;
  }
}

.btn-glow:hover {
  transform: translateY(-1px);
}

/* Permission badge tweaks su dark */
.badge.bg-success-subtle {
  background: rgba(25, 135, 84) !important;
}

.badge.bg-warning-subtle {
  background: rgba(255, 193, 7) !important;
}

.badge.bg-danger-subtle {
  background: rgba(220, 53, 69) !important;
}

/* Mini preview notifica stile Android/Chrome */
.notification-preview {
  margin-top: 1rem;
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 12px 14px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);

  .np-icon {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.1);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .np-content {
    display: grid;
    gap: 2px;

    .np-title {
      font-weight: 600;
      color: #fff;
    }

    .np-body {
      font-size: .95rem;
    }

    .np-url {
      font-size: .8rem;
      color: rgba(255, 255, 255, 0.6);
    }
  }
}

/* Piccola animazione per il glow follow mouse */
.btn-glow {
  &:hover {
    transition: transform .15s ease;
  }
}
</style>
