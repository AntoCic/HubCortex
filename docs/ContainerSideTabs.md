#### ContainerSideTabs

Layout con sidebar tab desktop + menu offcanvas mobile, pensato per cambiare contenuto per sezione.

Componenti collegati:
- `ContainerSideTabs.vue`: orchestratore (stato tab selezionato, sync route, contenuto)
- `SideTabs.ts`: tipi (`SideTabComponent`, `SideTabGroup`, `SideTabs`)
- `SideTabsList.vue`: render lista tab e gruppi
- `SideTabCmp.vue`: singolo item tab cliccabile

| prop | default | type | utilizzo |
| --- | --- | --- | --- |
| `tabs` | `-` | `SideTabs` | lista tab o gruppi (obbligatoria) |
| `modelValue` | `""` | `string` | nome tab attivo (`v-model`) |
| `color` | `-` | `string` | colore icona tab attivo |
| `hoverBgOpacity` | `5` | `number` | opacita hover/active background con `color-mix` |
| `contentClass` | `"px-3"` | `string` | classi area contenuto |
| `scrollToTopOnSelect` | `true` | `boolean` | scroll top area contenuto al cambio tab |
| `scrollToTopSmooth` | `true` | `boolean` | scroll top smooth o instant |
| `trackRoute` | `true` | `boolean` | sincronizza tab con query route |
| `routeQueryKey` | `"tab"` | `string` | chiave query usata per tab (`?tab=...`) |
| `routeUseReplace` | `false` | `boolean` | usa `router.replace` invece di `push` |
| `sidebarMinWidth` | `-` | `number` | larghezza minima sidebar desktop (px) |

| evento | payload | quando |
| --- | --- | --- |
| `update:modelValue` | `string` | quando selezioni tab o cambia query route |
| `select` | `SideTabComponent` | quando utente seleziona un tab |

### Tipi (`SideTabs.ts`)

```ts
export interface SideTabComponent {
  name: string;
  icon?: string;
  label?: string | Component;
  component?: Component;
}

export interface SideTabGroup {
  icon?: string;
  label: string | Component;
  subTabs: SideTabComponent[];
}

export type SideTabs = (SideTabGroup | SideTabComponent)[];
```

Regole pratiche:
- `name` deve essere univoco in tutta la struttura
- se un tab non ha `component`, il container mostra fallback "Nessun componente disponibile"
- puoi usare `label` stringa o componente Vue custom

### Come funziona internamente

- Desktop (`lg+`): sidebar fissa con `SideTabsList`
- Mobile (`<lg`): bottone menu + `Offcanvas` con la stessa lista tab
- Se `trackRoute = true`, legge `route.query[routeQueryKey]` e aggiorna `modelValue`
- Quando selezioni tab aggiorna query con `push` o `replace`
- Dopo selezione, se attivo, fa scroll top del contenuto interno

### Uso consigliato con file dedicato (tabs config)

#### 1) Crea file config tab

`src/defaultViews/settings/settingsTabs.ts`

```ts
import type { SideTabs } from "cic-kit";
import GeneralTab from "./tabs/GeneralTab.vue";
import SecurityTab from "./tabs/SecurityTab.vue";
import ProfileTab from "./tabs/ProfileTab.vue";

export const settingsTabs: SideTabs = [
  {
    icon: "settings",
    label: "Impostazioni",
    subTabs: [
      { name: "general", label: "Generali", icon: "tune", component: GeneralTab },
      { name: "security", label: "Sicurezza", icon: "lock", component: SecurityTab },
    ],
  },
  { name: "profile", label: "Profilo", icon: "person", component: ProfileTab },
];
```

#### 2) Usalo nella view

`src/defaultViews/settings/SettingsView.vue`

```vue
<script setup lang="ts">
import { ref } from "vue";
import { ContainerSideTabs } from "cic-kit";
import { settingsTabs } from "./settingsTabs";

const activeTab = ref("general");
</script>

<template>
  <ContainerSideTabs
    v-model="activeTab"
    :tabs="settingsTabs"
    color="#0ea5e9"
    :sidebar-min-width="260"
    route-query-key="section"
  />
</template>
```

Con `trackRoute=true` (default) l'URL diventa, ad esempio:
- `...?section=general`
- `...?section=security`

### Uso con slot (contenuto custom)

Se passi lo slot di default, gestisci tu il contenuto e il render automatico `selectedTab.component` non viene usato.

```vue
<ContainerSideTabs v-model="activeTab" :tabs="settingsTabs">
  <div v-if="activeTab === 'general'">...</div>
  <div v-else-if="activeTab === 'security'">...</div>
</ContainerSideTabs>
```

### Note utili

- Se `modelValue` e vuoto e non c'e query valida, nessun tab e selezionato.
- Per apertura diretta da URL, usa query coerente col `name` del tab.
- Se non vuoi sporcare history browser ad ogni click tab, imposta `routeUseReplace`.
- Per disattivare del tutto sync route, imposta `trackRoute=false`.
