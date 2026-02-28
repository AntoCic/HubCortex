# useStoreWatch

Guida pratica e completa per usare `useStoreWatch` con `FirestoreStore` e `FirestoreModel`.

## A cosa serve

`useStoreWatch` gestisce in automatico il lifecycle dei listener realtime (`store.start()` / `store.stop()`) in base a:

- stato login (`_Auth.isLoggedIn`)
- mount/unmount del componente Vue
- opzioni per store (`getOpts`, `getAuthOpts`, `checkLogin`)

In breve:

- utente loggato: avvia lo store con `getAuthOpts` (se presente) oppure `getOpts`
- utente non loggato + `checkLogin === true` (default): ferma lo store
- utente non loggato + `checkLogin === false`: avvia lo store con `getOpts`

## Firma

```ts
useStoreWatch(
  stores: readonly {
    store: AnyFirestoreStoreReactive
    getOpts?: GetProps
    getAuthOpts?: GetProps
    checkLogin?: boolean
  }[],
  defaultCheckLogin: boolean = true
)
```

## Prerequisiti (importante)

Per far funzionare lo store, il model deve estendere `FirestoreModel` e avere una collection valida:

- `static collectionName = "..."` nel model, oppure
- `collectionPath` passato nel costruttore di `FirestoreStore`

Esempio minimo model:

```ts
import { FirestoreModel } from "@/cmp/firebase/FirestoreModel";

export interface TaskData {
  id: string;
  projectId: string;
  title: string;
}

export class Task extends FirestoreModel<TaskData> {
  static collectionName = "tasks";

  projectId: string;
  title: string;

  constructor(data: TaskData) {
    super(data);
    this.projectId = data.projectId;
    this.title = data.title;
  }

  toData(): TaskData {
    return {
      id: this.id,
      projectId: this.projectId,
      title: this.title,
      ...this.timestampbleProps(),
    };
  }
}
```

## Esempio base (store protetto da login)

```ts
import { reactive } from "vue";
import { FirestoreStore } from "@/cmp/firebase/FirestoreStore";
import { useStoreWatch } from "@/cmp/firebase/useStoreWatch";
import { Task } from "@/models/Task";
import { where } from "firebase/firestore";

const taskStore = reactive(new FirestoreStore(Task));
const projectId = "project_123";

useStoreWatch([
  {
    store: taskStore,
    getAuthOpts: {
      query: where("projectId", "==", projectId),
    },
  },
]);
```

Con questa configurazione:

- se utente loggato: ascolta realtime solo i task con `projectId == "project_123"`
- se utente non loggato: `taskStore.stop()`

## Caso che hai richiesto: get di una collection con valore condiviso

Se vuoi prendere tutti i documenti che hanno un campo comune (esempio `projectId`, `teamId`, `companyId`, ecc.), usa `query: where(...)`.

```ts
import { where } from "firebase/firestore";

useStoreWatch([
  {
    store: taskStore,
    getAuthOpts: {
      query: where("projectId", "==", projectId),
    },
  },
]);
```

Questo e il pattern corretto per "tutti i documenti che condividono un id".

Nota: se per "id" intendi il vero document id Firestore, usa `ids` (vedi sotto).

## Tutti gli utilizzi principali di useStoreWatch

### 1) Store pubblico (anche senza login)

```ts
useStoreWatch(
  [
    {
      store: publicNewsStore,
      checkLogin: false,
      getOpts: { limit: 20, orderBy: { fieldPath: "createdAt", directionStr: "desc" } },
    },
  ],
  true // default globale
);
```

### 2) Strategia diversa guest vs logged

```ts
useStoreWatch([
  {
    store: productStore,
    checkLogin: false,
    getOpts: { limit: 10 }, // guest
    getAuthOpts: { limit: 100 }, // logged
  },
]);
```

### 3) Piu store insieme con regole miste

```ts
useStoreWatch(
  [
    {
      store: privateOrdersStore,
      getAuthOpts: { query: where("ownerId", "==", "uid123") },
      // checkLogin implicito: true
    },
    {
      store: publicCatalogStore,
      checkLogin: false,
      getOpts: { orderBy: { fieldPath: "name", directionStr: "asc" } },
    },
  ],
  true
);
```

### 4) Default globale senza login

```ts
useStoreWatch(
  [
    { store: aStore, getOpts: { limit: 5 } },
    { store: bStore, getOpts: { limit: 5 } },
  ],
  false // se non loggato parte comunque con getOpts
);
```

### 5) Query con piu condizioni

```ts
useStoreWatch([
  {
    store: taskStore,
    getAuthOpts: {
      query: [
        where("projectId", "==", projectId),
        where("status", "==", "OPEN"),
      ],
      orderBy: { fieldPath: "createdAt", directionStr: "desc" },
      limit: 50,
    },
  },
]);
```

### 6) Filtrare per document id

```ts
useStoreWatch([
  {
    store: taskStore,
    getAuthOpts: {
      ids: ["docA", "docB", "docC"],
    },
  },
]);
```

## GetProps completo (passato a `store.start()`)

`getOpts` / `getAuthOpts` accettano:

| campo | tipo | uso |
| --- | --- | --- |
| `ids` | `string[]` | filtra per document id (`documentId()`) |
| `query` | `QueryConstraint \| QueryConstraint[]` | query custom (`where`, ecc.) |
| `limit` | `number` | limite risultati |
| `orderBy` | `{ fieldPath, directionStr }` | ordinamento |
| `lastByCreate` | `number` | ultimi N per `createdAt desc` |
| `lastByUpdate` | `number` | ultimi N per `updatedAt desc` |
| `forceLocalSet` | `boolean` | reset cache/local e riscrittura da snapshot |
| `localSet` | `boolean` | sync su LocalStorage se supportato dal model |

## Regole/limiti validazione query

Le seguenti combinazioni non sono supportate:

- `ids` + `query` insieme
- `start()` con `ids.length > 10`
- `lastByCreate` + `lastByUpdate` insieme
- `lastByCreate` o `lastByUpdate` insieme a `limit`/`orderBy`

## Differenza fondamentale: `start()` vs `get()`

`useStoreWatch` usa `store.start()` (realtime listener).  
Se vuoi una fetch singola (one-shot), usa `store.get()` manualmente.

Esempio one-shot:

```ts
await taskStore.get({
  query: where("projectId", "==", projectId),
});
```

## Lifecycle automatico gestito da useStoreWatch

- `onBeforeMount`: crea una `watch` su `_Auth?.isLoggedIn` con `immediate: true`
- ogni cambio login: avvia/ferma ogni store secondo le regole sopra
- `onBeforeUnmount`: rimuove la watch e chiama `stop()` su tutti gli store

Quindi non serve chiamare `stop()` a mano nel componente che usa `useStoreWatch`.

## Pattern consigliato per progetto multi-tenant

Quando tutti i documenti appartengono a un contesto comune (es. `projectId`):

```ts
useStoreWatch([
  {
    store: someStore,
    getAuthOpts: {
      query: where("projectId", "==", activeProjectId),
    },
  },
]);
```

Se l'utente cambia `activeProjectId`, conviene ricreare la chiamata o riavviare lo store con nuove opzioni per cambiare query realtime.
