#### FieldColorTag

Campo tag colorati integrato con `vee-validate` (`useField`) e output array via `v-model`.

Tipi principali:
- `ColorTag`: `{ label: string; color: string }`
- `OnChangeColorTag`: `"add" | "edit" | "delete"`

| prop | default | type | utilizzo |
| --- | --- | --- | --- |
| `name` | `-` | `string` | nome campo `vee-validate` |
| `modelValue` | `[]` | `ColorTag[]` | valore controllato |
| `suggestions` | `[]` | `ColorTag[]` | lista suggerimenti filtrabile |
| `label` | `false` | `string \| boolean \| Component` | etichetta (`true` usa `name`) o componente custom |
| `placeholder` | `"Aggiungi tag..."` | `string` | placeholder input |
| `showErrors` | `true` | `boolean` | mostra errore validazione |
| `allowDuplicates` | `false` | `boolean` | consente tag con stesso `label` |
| `caseSensitive` | `false` | `boolean` | confronto duplicati/suggerimenti case-sensitive |
| `maxTags` | `null` | `number \| null` | massimo numero tag inseribili |
| `defaultColor` | `"#1985a1"` | `string` | colore default per nuovi tag |
| `class` | `-` | `any` | classi extra wrapper input |
| `style` | `-` | `any` | style inline wrapper input |
| `classLabel` | `-` | `any` | classi extra label |
| `required` | `false` | `boolean` | mostra asterisco nel label |

| evento | payload | quando |
| --- | --- | --- |
| `update:modelValue` | `ColorTag[]` | a ogni modifica valore |
| `change` | `(type: OnChangeColorTag, changedTag: ColorTag, value: ColorTag[])` | add/edit/delete |
| `add` | `ColorTag` | quando aggiungi un tag |
| `remove` | `ColorTag` | quando rimuovi un tag |
| `newSuggestion` | `ColorTag` | quando aggiungi un tag non presente in `suggestions` |
| `deleteSuggestion` | `ColorTag` | click su elimina suggerimento |

Comportamento valore:
- normalizza sempre con `toColorTagArray`
- ogni colore viene validato con `normalizeColorTagColor`
- se il colore non e valido, usa `COLOR_TAG_DEFAULT_COLOR` (`#1985a1`)
- confronto duplicati su `label` (trim), con o senza case-sensitive in base a `caseSensitive`

Comportamento input/tastiera:
- `Enter`, `,`, `Tab`: aggiunge tag corrente (o suggestion evidenziata)
- `ArrowDown` / `ArrowUp`: naviga suggerimenti
- `Escape`: chiude dropdown
- `Backspace` su input vuoto: rimuove ultimo tag
- `blur`: se c'e testo residuo, prova ad aggiungerlo automaticamente

Suggerimenti:
- dropdown visibile solo se input in focus, query non vuota e risultati presenti
- filtro per `includes` sul `label`
- se `allowDuplicates = false`, esclude suggestion gia presenti
- il bottone `x` per eliminare suggestion appare solo se ascolti `@deleteSuggestion`

Limite tag:
- con `maxTags`, oltre soglia blocca nuove aggiunte
- mostra messaggio: `Hai raggiunto il numero massimo di tag (...)`

```vue
<script setup lang="ts">
import { ref } from "vue";
import { FieldColorTag, type ColorTag } from "cic-kit";

const tags = ref<ColorTag[]>([
  { label: "Urgente", color: "#ef4444" },
]);
</script>

<template>
  <FieldColorTag
    name="tags"
    v-model="tags"
    label="Tag"
    placeholder="Scrivi e premi invio..."
  />
</template>
```

Esempio con suggerimenti, deduplica e limite:

```vue
<script setup lang="ts">
import { ref } from "vue";
import { FieldColorTag, type ColorTag } from "cic-kit";

const tags = ref<ColorTag[]>([]);
const suggestions = ref<ColorTag[]>([
  { label: "Backend", color: "#0ea5e9" },
  { label: "Frontend", color: "#8b5cf6" },
  { label: "Bug", color: "#ef4444" },
]);

function onNewSuggestion(tag: ColorTag) {
  // opzionale: persisti subito il nuovo suggerimento
  suggestions.value.push(tag);
}

function onDeleteSuggestion(tag: ColorTag) {
  suggestions.value = suggestions.value.filter((s) => s.label !== tag.label);
}
</script>

<template>
  <FieldColorTag
    name="tags"
    v-model="tags"
    :suggestions="suggestions"
    :allow-duplicates="false"
    :case-sensitive="false"
    :max-tags="8"
    @newSuggestion="onNewSuggestion"
    @deleteSuggestion="onDeleteSuggestion"
  />
</template>
```

Utility collegate (export da `cic-kit`):
- `toColorTag(value)`
- `toColorTagArray(value)`
- `normalizeColorTagColor(value)`
- `normalizeColorTagLabel(value)`
- `isSameColorTagArray(a, b)`
- `COLOR_TAG_DEFAULT_COLOR`
