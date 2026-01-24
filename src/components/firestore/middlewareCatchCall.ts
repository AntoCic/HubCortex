import { toast } from "../toast/toastController";

const FIREBASE_ERRORS = {
  // Firestore
  "unknown": "Errore sconosciuto.",
  "undefined": "Non trovato.",
  "cancelled": "Operazione annullata.",
  "invalid-argument": "Argomento non valido.",
  "deadline-exceeded": "Timeout dell’operazione.",
  "not-found": "Risorsa non trovata.",
  "already-exists": "La risorsa esiste già.",
  "permission-denied": "Non hai i permessi necessari.",
  "resource-exhausted": "Limite superato, riprova più tardi.",
  "failed-precondition": "Stato non valido per questa operazione.",
  "aborted": "Conflitto, operazione annullata.",
  "unavailable": "Servizio momentaneamente non disponibile.",

  // Auth
  "auth/email-already-in-use": "Questa email è già registrata.",
  "auth/wrong-password": "Password errata.",
  "auth/user-not-found": "Utente non trovato.",
  "auth/invalid-email": "Indirizzo email non valido.",
  "auth/too-many-requests": "Troppi tentativi, riprova più tardi.",
  "auth/requires-recent-login": "Per favore effettua di nuovo il login.",

  // Storage
  "storage/object-not-found": "File non trovato.",
  "storage/unauthenticated": "Devi effettuare il login.",
  "storage/unauthorized": "Non hai accesso a questo file.",
  "storage/quota-exceeded": "Quota di archiviazione superata."
} as const;

type FirebaseErrorCode = keyof typeof FIREBASE_ERRORS;
function isFirebaseErrorCode(code: string): code is FirebaseErrorCode {
  return code in FIREBASE_ERRORS;
}

export function middlewareCatchCall(error: any, showToast?: boolean) {

  if (showToast === false) return

  const code: string = typeof error?.code === 'string' ? error?.code : '';
  const msg = isFirebaseErrorCode(code) ? FIREBASE_ERRORS[code] : false;
  if (msg) {
    toast.error(msg);
  } else {
    toast.error(FIREBASE_ERRORS["unknown"]);
    console.log(`%cTodo gestire error.code "%c${error?.code}%c"`, "color:#fb9005; font-weight:bold;", "color:#0dfb05; font-weight:bold;", "color:#fb9005; font-weight:bold;");
    try {
      toast.logError(String(error));
    } catch (error) {
      toast.logError('on try to parse error');
    } finally {
      console.log('[ERROR from middlewareCatchCall]:', error);
    }
  }
}