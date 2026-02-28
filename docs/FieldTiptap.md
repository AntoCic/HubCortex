#### FieldTiptap

Editor rich-text Tiptap integrato con `vee-validate` (`useField`) e output HTML via `v-model`.

| prop | default | type | utilizzo |
| --- | --- | --- | --- |
| `name` | `-` | `string` | nome campo `vee-validate` |
| `modelValue` | `""` | `string` | contenuto HTML controllato |
| `label` | `false` | `string \| boolean \| Component` | etichetta (`true` usa `name`) o componente custom |
| `placeholder` | `"Scrivi qui..."` | `string` | placeholder dell'editor |
| `toolbarStickyOn` | `false` | `FieldTiptapToolbarSticky` | toolbar sticky: `"top"`, `"bottom"` o disattivata |
| `showErrors` | `true` | `boolean` | mostra errore validazione |
| `required` | `false` | `boolean` | mostra asterisco nel label |
| `class` | `-` | `any` | classi extra sul wrapper |
| `style` | `-` | `any` | style inline sul wrapper |
| `classLabel` | `-` | `any` | classi extra sul label |

`FieldTiptapToolbarSticky`:
- `"top" \| "bottom" \| false`

| evento | payload | quando |
| --- | --- | --- |
| `update:modelValue` | `string` | a ogni update dell'editor |

Comportamento valore:
- il valore e normalizzato con `normalizeTiptapHtml`
- se vuoto/null, viene convertito in `"<p></p>"`

Toolbar inclusa:
- blocco: paragrafo, `h1`, `h2`, `h3`
- stile: bold, italic, inline code
- liste: puntata, numerata
- extra: code block, link, undo, redo

```vue
<script setup lang="ts">
import { ref } from "vue";
import { Form } from "vee-validate";
import { FieldTiptap } from "cic-kit";

const bio = ref("<p>Ciao!</p>");
</script>

<template>
  <Form>
    <FieldTiptap
      name="bio"
      v-model="bio"
      label="Bio"
      placeholder="Scrivi una breve presentazione..."
      :toolbar-sticky-on="'top'"
      required
    />
  </Form>
</template>
```

Utility collegata:
- `normalizeTiptapHtml(value)` da `cic-kit`
