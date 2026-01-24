// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { firebaseConfig, VAPID_PUBLIC_KEY } from "./firebase-config";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { getMessaging, getToken, deleteToken } from "firebase/messaging";
import { pushMsg } from "./components/notification/pushMsg";
import { toast } from "./components/toast/toastController";
import { currentUserStore } from "./stores/currentUserStore";
import { store } from "./stores/store";

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, 'europe-west1');
export const messaging = getMessaging(app);
export { signInWithPopup };

// ----------------- EMULATORI IN LOCALE --------------------------------------

if (store.devMod) { // ! se si vuole testare in locale usando function e db online intervenire qua
    console.info('[Firebase] Uso emulatori locali');

    // porte prese da firebase.json
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectFunctionsEmulator(functions, 'localhost', 5001);
    connectStorageEmulator(storage, 'localhost', 9199);
}

// === FCM helpers (this-device) ==============================================

/** Ritorna il token FCM di questo dispositivo (o null se non disponibile). */
export async function getCurrentFcmToken(): Promise<string | null> {
    if (!pushMsg.isNotificationSupported) return null

    if (!pushMsg.reg) {
        toast.error('ServiceWorker non registrato');
        console.error("ServiceWorker non registrato");
        return null
    }

    if (!VAPID_PUBLIC_KEY) {
        toast.error('VAPID_PUBLIC_KEY mancante');
        console.error("VAPID_PUBLIC_KEY mancante");
        return null;
    }

    const token = await getToken(messaging, {
        vapidKey: VAPID_PUBLIC_KEY,
        serviceWorkerRegistration: pushMsg.reg,
    }).catch((e) => {
        console.error("Errore get token from getToken VAPID_PUBLIC_KEY", e);
        toast.error("Errore get token from getToken VAPID_PUBLIC_KEY")
        return null
    })

    return token || null
}


export async function registerFcmToken(): Promise<string | null> {
    if (!pushMsg.isNotificationSupported) return null
    if (pushMsg.needToAskPermission) await pushMsg.askPermission();

    const token = await getCurrentFcmToken()

    if (!token) return null
    if (!currentUserStore.isLoggedIn || !currentUserStore.user) {
        toast.error("Devi essere loggato per attivare le notifiche su questo dispositivo")
        return token
    }

    if (!(await currentUserStore.user.addFcmToken(token))) {
        toast.warning("Token non aggiunto possibilmente già presente.");
    } else {
        toast.success("Abilitato");
    }

    return token
}

/** True se il token di questo device è già registrato nell’utente corrente. */
export async function isThisDeviceTokenRegistered(): Promise<boolean> {
    const token = await getCurrentFcmToken()
    const usr = currentUserStore.user
    if (!token || !usr) return false
    return usr.hasFcmToken(token)
}

/**
 * Rimuove il token FCM di questo device
 */
export async function removeThisDeviceToken(): Promise<boolean> {
    const token = await getCurrentFcmToken()
    let fcmDeleted = false
    try {
        fcmDeleted = await deleteToken(messaging)
    } catch (e) {
        console.warn('deleteToken() failed (continuo con cleanup lato user):', e)
    }

    let userRemoved = false
    if (token && currentUserStore.user) {
        try {
            userRemoved = await currentUserStore.user.removeFcmToken(token)
        } catch (e) {
            console.warn('removeFcmToken() user failed:', e)
        }
    }
    if (fcmDeleted || userRemoved) {
        toast.success('Notifiche disattivate per questo dispositivo.')
        return true
    } else {
        toast.warning('Nessun token da rimuovere per questo dispositivo.')
        return false
    }
}



