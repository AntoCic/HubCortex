#### pushMsg (Notifiche Push)

Guida completa per usare le notifiche push nel progetto con `cic-kit`.

`pushMsg` espone tutto il necessario per:
- chiedere i permessi browser
- leggere/registrare il token FCM del device
- inviare notifiche locali
- inviare notifiche remote tramite Cloud Function

### Prerequisiti obbligatori

1. Firebase inizializzato con Messaging:

```ts
import { setupFirebase } from "cic-kit";
import { firebaseConfig, VAPID_PUBLIC_KEY } from "./firebase-config";

setupFirebase(firebaseConfig, VAPID_PUBLIC_KEY);
```

Nota: in alternativa puoi assegnare manualmente:

```ts
import { pushMsg } from "cic-kit";
pushMsg.vapidPublicKey = VAPID_PUBLIC_KEY;
```

2. Auth inizializzata (serve per salvare il token su `_Auth.user`):

```ts
import { initAuth, _CurrentUser } from "cic-kit";

const Auth = initAuth(_CurrentUser);
Auth.checkAuth();
```

3. Service Worker registrato (fondamentale per FCM token e notifiche background):

```vue
<script setup lang="ts">
import { RegisterSW } from "cic-kit";
import { registerSW } from "virtual:pwa-register";
</script>

<template>
  <RegisterSW :registerSW="registerSW" />
</template>
```

4. Per invio remoto: Cloud Function `sendUserPush` deployata (chiamata da `pushMsg.sendTo`).

### API disponibile

| elemento | type | cosa fa |
| --- | --- | --- |
| `pushMsg.permission` | `NotificationPermission` | stato permesso (`granted`, `default`, `denied`) |
| `pushMsg.needToAskPermission` | `boolean` | `true` se devi ancora chiedere permesso |
| `pushMsg.askPermission()` | `() => Promise<NotificationPermission>` | chiede permesso; se granted prova anche a registrare il token |
| `pushMsg.send(content)` | `(string \| PushMsgContent) => Promise<void>` | invia notifica locale sul device corrente |
| `pushMsg.sendTo(uid, content)` | `(uid: string, content: string \| PushMsgContent) => Promise<boolean>` | invia notifica remota a un utente (Cloud Function) |
| `pushMsg.getCurrentFcmToken()` | `() => Promise<string \| null>` | prende token FCM del device |
| `pushMsg.registerFcmToken()` | `() => Promise<string \| null>` | registra token su utente corrente |
| `pushMsg.isThisDeviceTokenRegistered()` | `() => Promise<boolean>` | verifica se il token del device e gia su `_Auth.user.fcmTokens` |
| `pushMsg.removeThisDeviceToken()` | `() => Promise<boolean>` | rimuove token da browser e utente |

### Payload notifica (`PushMsgContent`)

`PushMsgContent` estende `NotificationOptions` e richiede `title`.

```ts
type PushMsgContent = NotificationOptions & {
  title: string;
};
```

Default automatici applicati internamente:
- `icon`: `"/img/logo/pwa.png"`
- `tag`: `default-YYYY-MM-DD`
- `data.url`: `"/"`

Esempio:

```ts
{
  title: "Nuovo ordine",
  body: "Hai ricevuto un nuovo ordine",
  icon: "/img/logo/pwa.png",
  data: { url: "/orders/123" },
  silent: false
}
```

### Flusso consigliato (device corrente)

```ts
import { pushMsg } from "cic-kit";

await pushMsg.askPermission();
const token = await pushMsg.registerFcmToken();
const registered = await pushMsg.isThisDeviceTokenRegistered();
```

Disattivazione:

```ts
await pushMsg.removeThisDeviceToken();
```

### Inviare una notifica locale

```ts
await pushMsg.send({
  title: "Notifica locale",
  body: "Questo e un test sul device corrente",
  data: { url: "/demo/push" },
});
```

Comportamento:
- se permesso non concesso, `send()` chiama prima `askPermission()`
- se esiste `ServiceWorkerRegistration`, usa `showNotification(...)`
- altrimenti fallback a `new Notification(...)`

### Inviare una notifica remota (a un altro utente)

```ts
const ok = await pushMsg.sendTo("UID_DESTINATARIO", {
  title: "Notifica remota",
  body: "Messaggio inviato dal pannello admin",
  data: { url: "/orders" },
});
```

`sendTo` ritorna:
- `true`: invio richiesto con successo alla Cloud Function
- `false`: errore (Firebase non init, funzione assente/errore, ecc.)

### Esempio componente completo

```vue
<script setup lang="ts">
import { computed, ref } from "vue";
import { _Auth, pushMsg } from "cic-kit";

const token = ref<string | null>(null);
const registered = ref(false);
const toUid = ref(_Auth?.uid ?? "");

const permission = computed(() => pushMsg.permission);

async function enableDevice() {
  await pushMsg.askPermission();
  token.value = await pushMsg.registerFcmToken();
  registered.value = await pushMsg.isThisDeviceTokenRegistered();
}

async function disableDevice() {
  await pushMsg.removeThisDeviceToken();
  token.value = await pushMsg.getCurrentFcmToken();
  registered.value = await pushMsg.isThisDeviceTokenRegistered();
}

async function sendRemote() {
  if (!toUid.value) return;
  await pushMsg.sendTo(toUid.value, {
    title: "Test push",
    body: "Ciao da cic-kit",
    data: { url: "/" },
  });
}
</script>
```

### Errori comuni e soluzione

- `Firebase non inizializzato (...)`
  - chiama `setupFirebase(...)` prima di usare `pushMsg`

- `ServiceWorker non registrato`
  - monta `<RegisterSW :registerSW="registerSW" />`
  - verifica che la registrazione avvenga davvero in produzione/dev

- `vapidPublicKey mancante`
  - passa la VAPID key a `setupFirebase(config, vapidKey)` o `pushMsg.vapidPublicKey = ...`

- permesso `denied`
  - il browser non mostrera piu il popup: devi riabilitare dalle impostazioni sito/browser

- `Devi essere loggato per attivare le notifiche su questo dispositivo`
  - `registerFcmToken()` ha ottenuto il token ma non puo salvarlo in `fcmTokens` senza utente loggato

- `Errore invio notifica` in `sendTo`
  - controlla Cloud Function `sendUserPush`, permessi IAM/rules e token destinatario presente

### Note importanti

- I metodi con parametro `_legacyCurrentUser` sono mantenuti per compatibilita ma oggi ignorati.
- Per ricezione in background e click su notifica, il Service Worker deve gestire eventi `push` e `notificationclick`.
- La persistenza token usa i metodi utente `addFcmToken`, `removeFcmToken`, `hasFcmToken` (gia presenti in `_CurrentUser`).
