import { reactive } from 'vue'
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth'
import { auth, provider } from '../firebase'
import { User } from '../models/User'
import { UserPermission } from '@shared/enums/UserPermission'
import router from '../router'
import { userPublicStore } from './userPublicStore'
import { LS } from '../components/localStorage/LS'
import { LocalStorageKey, LS_keyNotToDelete, LS_keyToDelete } from '@shared/enums/LocalStorageKey'
import { toast } from '../components/toast/toastController'
import { phoneNumberFromString, type PhoneNumber } from '../components/input/PhoneNumber/PhoneNumber'
import type { Gender } from '../components/input/Gender/FieldGender.vue'
import { store } from './store'
const LAST_SEEN_TTL_DAYS = 30;

export interface UserData {
  uid: string | null | false
  loginEmail: string | null
  displayName: string | null
}

class CurrentUserStore {
  uid: string | null | false = false
  loginEmail: string | null = null
  displayName: string | null = null
  user: User | undefined = undefined
  onLoginDone: boolean = false
  lastSeenInterval: number | undefined;

  get name(): string | undefined {
    return this.user?.name
  }
  get surname(): string | undefined {
    return this.user?.surname
  }
  get email(): string | undefined {
    return this.user?.email
  }
  get phoneNumber(): PhoneNumber | undefined {
    return this.user?.phoneNumber
  }
  get photoURL(): string | undefined {
    return this.user?.photoURL
  }
  get birthDate(): string | undefined {
    return this.user?.birthDate
  }
  get description(): string | undefined {
    return this.user?.description
  }

  get permissions(): UserPermission[] | undefined {
    return this.user?.permissions ? this.user?.permissions as UserPermission[] : undefined
  }

  get gender(): Gender | undefined {
    return this.user?.gender
  }
  get birthHideYear(): boolean | undefined {
    return this.user?.birthHideYear
  }
  get offlineAllow(): boolean | undefined {
    return this.user?.offlineAllow
  }

  private setLoginUser(uid: string | null, loginEmail: string | null, displayName: string | null) {
    this.uid = uid
    this.loginEmail = loginEmail
    this.displayName = displayName
  }

  async loginWithGoogle(): Promise<void> {
    try {
      const result = await signInWithPopup(auth, provider)
      const loginUser = result.user
      this.setLoginUser(loginUser.uid, loginUser.email, loginUser.displayName);

      const redirectPath = router.currentRoute.value.query.redirect as string | undefined

      if (redirectPath) {
        await router.push(redirectPath)
      } else {
        await router.push({ name: 'home' })
      }
      console.log('Login riuscito:', this.displayName)
    } catch (error) {
      console.error('Errore nel login:', error)
    }
  }

  cleanLS_logout() {
    Object.values(LS_keyToDelete).forEach(k => {
      if (!LS_keyNotToDelete.includes(k)) LS.delete(k);
    })

    // cleanStores
    userPublicStore.items = {}
  }

  async logout() {
    this.cleanLS_logout();

    try {
      await signOut(auth);
      router.push({ name: 'login' })
    } catch (error) {
      console.error('Logout failed', error);
    }

    this.setLoginUser(null, null, null);
    store.debugMod = false;
    this.onLoginDone = false;
  }

  checkAuth() {
    onAuthStateChanged(auth, async (loginUser) => {
      if (loginUser) {
        this.setLastLogin();
        this.setLoginUser(loginUser.uid, loginUser.email, loginUser.displayName);
        console.log(
          "%cG%co%cg%cg%cl%ce %cLogin:%c " + this.displayName,
          "color:#4285F4; font-weight:bold;",
          "color:#EA4335; font-weight:bold;",
          "color:#FBBC05; font-weight:bold;",
          "color:#4285F4; font-weight:bold;",
          "color:#34A853; font-weight:bold;",
          "color:#EA4335; font-weight:bold;",
          "color:inherit; font-weight:normal;",
          "color:#2fe7ff; font-weight:bold;"
        );

        try {
          this.user = await User.get(loginUser.uid)
          if (this.isSuperAdmin) {
            store.debugMod = !!(LS.getParsed(LocalStorageKey.storeDebugMod));
          }
        } catch (error) {
          try {
            const docs = LS.getParsed(LocalStorageKey.currentUser)
            if (docs) {
              for (const _ in docs) {
                this.user = new User(docs[loginUser.uid])
              }
              toast.info('localGet user')
            }
          } catch (error) {
            toast.error('Error localGet user')
          }

        }

        if (!this.user) {

          const raw = (loginUser.displayName ?? '').trim()
          let name = ''
          let surname = ''

          if (raw) {
            const [first, ...rest] = raw.split(/\s+/)
            name = first ?? ''
            surname = rest.join(' ')
          }

          const userPublic = await userPublicStore.add({
            id: loginUser.uid,
            name,
            surname,
          })

          const newUser = new User({
            id: loginUser.uid,
            name,
            surname,
            email: loginUser.email ?? '',
            phoneNumber: loginUser.phoneNumber ? phoneNumberFromString(loginUser.phoneNumber) : undefined,
            photoURL: loginUser.photoURL ?? undefined,
            permissions: [],
            userPublicId: userPublic.id,
          })
          await newUser.create();
          router.push({ name: 'home' })
        }
        this.onLoginDone = true;
      } else {
        this.logout();
      }
    })
  }

  /**
 * Verifica se l'ultimo accesso dell'utente salvato in localStorage è scaduto.
 * @returns true se l'utente deve essere considerato NON valido (mai visto o TTL superato)
 */
  checkLastLogin(): boolean {
    const lastSeen = Number(LS.getStr(LocalStorageKey.lastLoginCurrentUser));
    if (!lastSeen) return true;
    const LAST_SEEN_TTL_MS = LAST_SEEN_TTL_DAYS * 24 * 60 * 60 * 1000;
    return Date.now() - lastSeen > LAST_SEEN_TTL_MS;
  }
  setLastLogin() {
    LS.set(LocalStorageKey.lastLoginCurrentUser, Date.now());
  }

  get isLoginChecked(): boolean {
    return this.uid !== false
  }

  get isLoggedIn(): boolean {
    return this.uid !== null && this.uid !== false
  }

  get isSuperAdmin(): boolean {
    return this.isLoggedIn ? (currentUserStore.user?.hasPermission(UserPermission.SUPERADMIN) ?? false) : false
  }

  get isAdmin(): boolean {
    return this.isLoggedIn ? (currentUserStore.user?.hasPermission(UserPermission.ADMIN) ?? false) : false
  }
}

export const currentUserStore = reactive(new CurrentUserStore())


