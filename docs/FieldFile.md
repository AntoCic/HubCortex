#### FieldFile

Campo file per `vee-validate` con supporto click, drag&drop, singolo o multiplo.

| prop | default | type | utilizzo |
| --- | --- | --- | --- |
| `name` | `-` | `string` | nome campo `vee-validate` |
| `modelValue` | `null` / `[]` | `FieldFileValue` | valore controllato (`File`, `File[]`, `null`) |
| `rules` | `-` | `RuleExpression<FieldFileValue>` | regole validazione |
| `label` | `"+"` | `string` | testo bottone dropzone default |
| `className` | `""` | `any` | classi extra bottone default |
| `showList` | `true` | `boolean` | mostra lista file selezionati |
| `showErrors` | `true` | `boolean` | mostra errore validazione |
| `showSize` | `true` | `boolean` | mostra dimensione file |
| `removable` | `true` | `boolean` | abilita rimozione file dalla lista |
| `multiple` | `false` | `boolean` | abilita selezione multipla |
| `accept` | `-` | `string` | filtro MIME/estensioni (`image/*`, `.pdf`, ...) |
| `disabled` | `false` | `boolean` | disabilita input e dropzone |
| `required` | `false` | `boolean` | imposta required HTML |
| `capture` | `-` | `"user" \| "environment" \| boolean` | forza fotocamera su mobile solo se impostata |
| `listClass` | `-` | `any` | classi extra lista file |

Nota mobile: se `capture` non viene passata, il browser puo proporre sia fotocamera sia libreria file/foto.

| evento | payload | quando |
| --- | --- | --- |
| `update:modelValue` | `FieldFileValue` | ad ogni cambio valore |
| `change` | `File[]` | quando cambia la selezione |
| `remove` | `(file: File, index: number)` | quando rimuovi un file dalla lista |
| `clear` | `void` | quando svuoti il campo |
| `open` | `void` | quando si apre il picker file |

`slot dropzone`
- Props: `{ open, clear, files, disabled, dragging, errorMessage, meta }`

`defineExpose`
- `open()`
- `clear()`
- `files` (`ComputedRef<File[]>`)

```vue
<script setup lang="ts">
import { FieldFile } from "cic-kit";
</script>

<template>
  <FieldFile name="avatar" accept="image/*" />
</template>
```

Esempio multiplo con output `string[]` URL:

```vue
<script setup lang="ts">
import { ref } from "vue";
import { FieldFile, toFileArray, uploadFilesToUrls } from "cic-kit";
import { _Auth } from "cic-kit";

const uploadedUrls = ref<string[]>([]);

async function onSubmit(value: File | File[] | null) {
  if (!_Auth?.publicUserFolder) return;

  const files = toFileArray(value);
  uploadedUrls.value = await uploadFilesToUrls(files, async (file, index) => {
    const upload = await _Auth.publicUserFolder!.update(`gallery-${index}-${file.name}`, file);
    return upload.url;
  });
}
</script>

<template>
  <FieldFile name="gallery" accept="image/*" multiple />
</template>
```
