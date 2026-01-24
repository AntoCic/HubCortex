<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { doc, getDoc, Timestamp } from 'firebase/firestore'
import { db } from '../../../firebase'
import { currentUserStore } from '../../../stores/currentUserStore'
import { userPublicStore } from '../../../stores/userPublicStore'
import { toast } from '../../toast/toastController'

import { UserPermission as PERM, UserPermission } from '@shared/enums/UserPermission'
import { User } from '../../../models/User'
import { appConfigStore } from '../../../stores/appConfigStore'
import rawPkg from '../../../../package.json'
import { loading } from '../../loading/loadingController'
import BtnCmp from '../../Btn/BtnCmp.vue'
import PwaUpdateButton from '../../Btn/PwaUpdateButton.vue'

const pkg = rawPkg as { name?: string; version?: string }

const search = ref('')
const openInfo = ref<boolean>(false)
const modalUid = ref<string | null>(null)
const busy = ref(false)
const modalUser = ref<User | null | undefined>(null)
const appConfig = computed(() => appConfigStore.items?.[pkg?.name ?? ''])

const allPermissions = computed<UserPermission[]>(
  () => Object.values(PERM).filter((p: UserPermission) => p !== PERM.SUPERADMIN)
)

const users = computed(() =>
  (userPublicStore.itemsArray || [])
    .filter(u => {
      const q = search.value.trim().toLowerCase()
      if (!q) return true
      const name = `${u.name || ''} ${u.surname || ''}`.toLowerCase()
      return name.includes(q) || (u.id || '').toLowerCase().includes(q)
    })
    .sort((a, b) => {
      const an = `${a.name || ''} ${a.surname || ''}`.trim().toLowerCase()
      const bn = `${b.name || ''} ${b.surname || ''}`.trim().toLowerCase()
      return an.localeCompare(bn)
    })
)

async function getUser(id: string): Promise<User | undefined> {
  try {
    const ref = doc(db, 'users', id)
    const snap = await getDoc(ref)
    return snap.exists() ? new User({ id, ...(snap.data() as any) }) : undefined
  } catch (error) {
    toast.error(String(error))
    throw error
  }
}

async function openModal(uid: string) {
  openInfo.value = false
  modalUid.value = uid
  modalUser.value = await getUser(uid)
}

function closeModal() {
  openInfo.value = false
  modalUid.value = null
  modalUser.value = null
}

async function grantAll() {
  if (!modalUser.value) return
  try {
    busy.value = true
    const changed = await modalUser.value.addPermissions(allPermissions.value)
    if (changed) toast.success('Tutti i permessi concessi')
  } catch (e) {
    toast.error(String(e))
  } finally {
    busy.value = false
  }
}

async function revokeAll() {
  if (!modalUser.value) return
  try {
    busy.value = true
    const changed = await modalUser.value.deletePermissions(allPermissions.value as any)
    if (changed) toast.success('Tutti i permessi revocati')
  } catch (e) {
    toast.error(String(e))
  } finally {
    busy.value = false
  }
}

async function togglePerm(perm: UserPermission) {
  if (!modalUser.value) return
  try {
    busy.value = true
    if (modalUser.value.hasPermission(perm)) {
      await modalUser.value.deletePermissions(perm)
    } else {
      await modalUser.value.addPermissions(perm)
    }
  } catch (e) {
    toast.error(String(e))
  } finally {
    busy.value = false
  }
}

onMounted(async () => {
  loading.on()
  if (!currentUserStore.isLoggedIn) return loading.off();
  try {
    await userPublicStore.get()
    await appConfigStore.get()
  } finally {
    loading.off();
  }
})
</script>

<template>
  <div class="container overflow-auto h-100">
    <div class="row mb-3 align-items-center">
      <div class="col-12">
        <h4>Config:</h4>
        <p>lastVersion: {{ appConfig?.lastVersion ? appConfig.lastVersion : 'notfound' }} (currentLocal: {{ pkg.version
        }})</p>
      </div>
      <div class="col-4">
        <PwaUpdateButton class="mx-auto" />
      </div>
      <div class="col-4">
        <h2 v-if="!pkg?.name" class="text-danger">attenzione pkg.name non settato</h2>
        <h2 v-if="!pkg?.version" class="text-danger">attenzione pkg.version non settato</h2>
        <button type="button" class="buttonUpdateAllUser mx-auto"
          v-if="pkg.name && pkg.version && appConfig?.lastVersion !== pkg.version"
          @click="() => appConfig ? appConfig.update({ lastVersion: pkg.version }) : appConfigStore.add({ lastVersion: pkg?.version ?? '', id: pkg.name })">
          <span class="fold"></span>

          <div class="points_wrapper">
            <i class="point"></i>
            <i class="point"></i>
            <i class="point"></i>
            <i class="point"></i>
            <i class="point"></i>
            <i class="point"></i>
            <i class="point"></i>
            <i class="point"></i>
            <i class="point"></i>
            <i class="point"></i>
          </div>

          <span class="inner"><svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5">
              <polyline points="13.18 1.37 13.18 9.64 21.45 9.64 10.82 22.63 10.82 14.36 2.55 14.36 13.18 1.37">
              </polyline>
            </svg>Update All User</span>
        </button>
      </div>
      <div class="col-4">
      </div>
    </div>

    <div class="d-flex align-items-center justify-content-between mb-2">
      <h4 class="m-0">Gestione permessi</h4>
      <div class="ms-2" style="min-width:240px">
        <input v-model="search" type="search" class="form-control form-control-sm" placeholder="Cerca utente…">
      </div>
    </div>

    <div class="list-group">
      <div v-if="!users.length" class="list-group-item text-muted">
        Nessun utente trovato.
      </div>

      <button v-for="u in users" :key="u.id"
        class="list-group-item d-flex justify-content-between align-items-center text-start"
        @click="() => !modalUid ? openModal(u.id) : closeModal()">
        <div class="me-2 text-truncate" style="min-width:0">
          <div class="fw-semibold text-truncate">
            {{ u.fullName }}
            <small v-if="u.id === currentUserStore.uid" class="text-muted">(tu)</small>
          </div>
          <small class="text-muted">UID: <code class="bg-light rounded">{{ u.id }}</code> </small>
        </div>
        <div class="d-flex align-items-center gap-2">
          <span class="badge bg-secondary">Permessi</span>
          <span class="material-symbols-outlined align-middle">chevron_right</span>
        </div>
      </button>

      <div v-if="modalUid && modalUser" class="container-fluid bg-white text-dark">
        <div class="row align-items-center mb-3">
          <div class="col-auto">
            <div class="rounded-circle bg-light d-flex align-items-center justify-content-center"
              style="width:48px;height:48px;overflow:hidden">
              <img v-if="modalUser.photoURL" :src="modalUser.photoURL" alt="avatar" class="img-fluid"
                style="width:100%;height:100%;object-fit:cover" />
              <span v-else class="material-symbols-outlined">person</span>
            </div>
          </div>
          <div class="col">
            <div class="fw-semibold">{{ modalUser?.email }}</div>
            <button type="button" class="btn btn-link btn-sm text-decoration-none px-0" :aria-pressed="openInfo"
              :aria-expanded="openInfo" @click="openInfo = !openInfo">
              <span class="material-symbols-outlined align-middle me-1">
                {{ openInfo ? 'expand_less' : 'expand_more' }}
              </span>
              {{ openInfo ? 'Nascondi dettagli' : 'Mostra dettagli' }}
            </button>
          </div>
          <div class="col-12"></div>
          <template v-if="openInfo">
            <template v-for="(value, key) in modalUser" :key="key">
              <template v-if="
                key !== 'id' &&
                key !== 'surname' &&
                key !== 'permissions' &&
                key !== 'name'
              ">

                <div class="col-4">
                  <p class="mb-1">{{ key }}:</p>
                </div>

                <div class="col-8">
                  <code v-if="value === null || value === undefined" class="bg-light rounded mb-1 px-1">{{
                    value ===
                      null ?
                      'null' :
                      'undefined'
                  }}</code>
                  <template v-if="value !== null || value !== undefined">
                    <pre v-if="value instanceof Timestamp"
                      class="bg-light text-primary rounded mb-1 px-1">{{ value.toDate().toLocaleString() }}</pre>
                    <pre v-else class="bg-light rounded mb-1 px-1">{{ value }}</pre>
                  </template>
                </div>
              </template>
            </template>
          </template>
        </div>

        <!-- Permessi correnti -->
        <div class="mb-3">
          <div class="mb-2 small text-muted">Permessi correnti:</div>
          <div class="d-flex flex-wrap gap-2">
            <span v-for="perm in allPermissions" :key="perm + '_badge'" :disabled="busy" @click="() => togglePerm(perm)"
              class="badge cursor-pointer"
              :class="modalUser.hasPermission(perm) ? 'bg-primary' : 'bg-light text-muted border'">
              {{ perm }}
            </span>
          </div>
        </div>

        <div class="row mb-3">
          <div class="col-6 col-md-auto pe-1">
            <BtnCmp size="sm" variant="outline" block icon="checklist" :disabled="busy" @click="grantAll">
              Concedi tutti
            </BtnCmp>
          </div>
          <div class="col-6 col-md-auto ps-1">
            <BtnCmp size="sm" variant="outline" block color="danger" icon="block" :disabled="busy" @click="revokeAll">
              Revoca tutti
            </BtnCmp>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- <ModalCmp :modelValue="!!modalUid" title="Modifica permessi" :centered="true" backdrop="static" cancel-text="Chiudi"
    @close="closeModal">
  </ModalCmp> -->
</template>

<style>
.buttonUpdateAllUser {
  --h-button: 48px;
  --w-button: 102px;
  --round: 0.75rem;
  cursor: pointer;
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: all 0.25s ease;
  background: radial-gradient(65.28% 65.28% at 50% 100%,
      rgba(223, 113, 255, 0.8) 0%,
      rgba(223, 113, 255, 0) 100%),
    linear-gradient(0deg, #7a5af8, #7a5af8);
  border-radius: var(--round);
  border: none;
  outline: none;
  padding: 12px 18px;
}

.buttonUpdateAllUser::before,
.buttonUpdateAllUser::after {
  content: "";
  position: absolute;
  inset: var(--space);
  transition: all 0.5s ease-in-out;
  border-radius: calc(var(--round) - var(--space));
  z-index: 0;
}

.buttonUpdateAllUser::before {
  --space: 1px;
  background: linear-gradient(177.95deg,
      rgba(255, 255, 255, 0.19) 0%,
      rgba(255, 255, 255, 0) 100%);
}

.buttonUpdateAllUser::after {
  --space: 2px;
  background: radial-gradient(65.28% 65.28% at 50% 100%,
      rgba(223, 113, 255, 0.8) 0%,
      rgba(223, 113, 255, 0) 100%),
    linear-gradient(0deg, #7a5af8, #7a5af8);
}

.buttonUpdateAllUser:active {
  transform: scale(0.95);
}

.fold {
  z-index: 1;
  position: absolute;
  top: 0;
  right: 0;
  height: 1rem;
  width: 1rem;
  display: inline-block;
  transition: all 0.5s ease-in-out;
  background: radial-gradient(100% 75% at 55%,
      rgba(223, 113, 255, 0.8) 0%,
      rgba(223, 113, 255, 0) 100%);
  box-shadow: 0 0 3px black;
  border-bottom-left-radius: 0.5rem;
  border-top-right-radius: var(--round);
}

.fold::after {
  content: "";
  position: absolute;
  top: 0;
  right: 0;
  width: 150%;
  height: 150%;
  transform: rotate(45deg) translateX(0%) translateY(-18px);
  background-color: #e8e8e8;
  pointer-events: none;
}

.buttonUpdateAllUser:hover .fold {
  margin-top: -1rem;
  margin-right: -1rem;
}

.points_wrapper {
  overflow: hidden;
  width: 100%;
  height: 100%;
  pointer-events: none;
  position: absolute;
  z-index: 1;
}

.points_wrapper .point {
  bottom: -10px;
  position: absolute;
  animation: floating-points infinite ease-in-out;
  pointer-events: none;
  width: 2px;
  height: 2px;
  background-color: #fff;
  border-radius: 9999px;
}

@keyframes floating-points {
  0% {
    transform: translateY(0);
  }

  85% {
    opacity: 0;
  }

  100% {
    transform: translateY(-55px);
    opacity: 0;
  }
}

.points_wrapper .point:nth-child(1) {
  left: 10%;
  opacity: 1;
  animation-duration: 2.35s;
  animation-delay: 0.2s;
}

.points_wrapper .point:nth-child(2) {
  left: 30%;
  opacity: 0.7;
  animation-duration: 2.5s;
  animation-delay: 0.5s;
}

.points_wrapper .point:nth-child(3) {
  left: 25%;
  opacity: 0.8;
  animation-duration: 2.2s;
  animation-delay: 0.1s;
}

.points_wrapper .point:nth-child(4) {
  left: 44%;
  opacity: 0.6;
  animation-duration: 2.05s;
}

.points_wrapper .point:nth-child(5) {
  left: 50%;
  opacity: 1;
  animation-duration: 1.9s;
}

.points_wrapper .point:nth-child(6) {
  left: 75%;
  opacity: 0.5;
  animation-duration: 1.5s;
  animation-delay: 1.5s;
}

.points_wrapper .point:nth-child(7) {
  left: 88%;
  opacity: 0.9;
  animation-duration: 2.2s;
  animation-delay: 0.2s;
}

.points_wrapper .point:nth-child(8) {
  left: 58%;
  opacity: 0.8;
  animation-duration: 2.25s;
  animation-delay: 0.2s;
}

.points_wrapper .point:nth-child(9) {
  left: 98%;
  opacity: 0.6;
  animation-duration: 2.6s;
  animation-delay: 0.1s;
}

.points_wrapper .point:nth-child(10) {
  left: 65%;
  opacity: 1;
  animation-duration: 2.5s;
  animation-delay: 0.2s;
}

.inner {
  z-index: 2;
  gap: 6px;
  position: relative;
  width: 100%;
  color: white;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.5;
  transition: color 0.2s ease-in-out;
}

.inner svg.icon {
  width: 18px;
  height: 18px;
  transition: fill 0.1s linear;
}

.buttonUpdateAllUser:focus svg.icon {
  fill: white;
}

.buttonUpdateAllUser:hover svg.icon {
  fill: transparent;
  animation:
    dasharray 1s linear forwards,
    filled 0.1s linear forwards 0.95s;
}

@keyframes dasharray {
  from {
    stroke-dasharray: 0 0 0 0;
  }

  to {
    stroke-dasharray: 68 68 0 0;
  }
}

@keyframes filled {
  to {
    fill: white;
  }
}
</style>
