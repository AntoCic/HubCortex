#### Modal

Modal Bootstrap 5 controllata via `v-model`, con header/footer opzionali e bottoni default.

| prop              | default   | type                                            | utilizzo                       |
| ----------------- | --------- | ----------------------------------------------- | ------------------------------ |
| `modelValue`      | —         | `boolean \| string \| number`                   | v-model apertura/chiusura      |
| `title`           | —         | `string`                                        | titolo header di default       |
| `size`            | —         | `"sm" \| "lg" \| "xl"`                          | dimensione dialog              |
| `fullscreen`      | —         | `true \| "sm" \| "md" \| "lg" \| "xl" \| "xxl"` | fullscreen responsive          |
| `centered`        | —         | `boolean`                                       | centra verticalmente           |
| `scrollable`      | —         | `boolean`                                       | body scrollabile               |
| `backdrop`        | `true`    | `boolean \| "static"`                           | backdrop e comportamento       |
| `keyboard`        | `true`    | `boolean`                                       | chiusura con ESC               |
| `teleportTo`      | `"body"`  | `string`                                        | destinazione teleport          |
| `okText`          | —         | `string`                                        | se undefined, OK nascosto      |
| `cancelText`      | —         | `string`                                        | se undefined, Annulla nascosto |
| `okClass`         | —         | `string`                                        | classi extra bottone OK        |
| `cancelClass`     | —         | `string`                                        | classi extra bottone Annulla   |
| `okColor`         | —         | `BtnColor`                                      | colore Btn OK               |
| `cancelColor`     | —         | `BtnColor`                                      | colore Btn Annulla          |
| `okVariant`       | —         | `BtnVariant`                                    | variante Btn OK             |
| `cancelVariant`   | `"ghost"` | `BtnVariant`                                    | variante Btn Annulla        |
| `closeOnOk`       | `true`    | `boolean`                                       | chiude dopo OK                 |
| `hideHeaderClose` | —         | `boolean`                                       | nasconde la X                  |
| `id`              | —         | `string`                                        | id del root modal              |
| `onOk`            | —         | `() => void \| Promise<void>`                   | azione su OK                   |

```vue
<script setup lang="ts">
import { ref } from "vue";

const open = ref(false);
</script>

<template>
  <button class="btn btn-primary" @click="open = true">Apri</button>

  <Modal v-model="open" title="Titolo" cancelText="Annulla" okText="OK">
    Contenuto della modal
  </Modal>
</template>
```
