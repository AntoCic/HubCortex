#### Btn

Button Bootstrap con varianti, icona, loading e navigazione router.

| prop       | default  | type                                                                                            | utilizzo                    |
| ---------- | -------- | ----------------------------------------------------------------------------------------------- | --------------------------- |
| `variant`  | `solid`  | `"solid" \| "outline" \| "ghost" \| "link"`                                                     | stile del bottone           |
| `color`    | `dark`   | `"primary" \| "secondary" \| "success" \| "danger" \| "warning" \| "info" \| "light" \| "dark"` | cambia colore Bootstrap     |
| `size`     | —        | `"sm" \| "lg"`                                                                                  | dimensione Bootstrap        |
| `block`    | `false`  | `boolean`                                                                                       | full width (`w-100`)        |
| `disabled` | `false`  | `boolean`                                                                                       | disabilita click            |
| `type`     | `button` | `"button" \| "submit" \| "reset"`                                                               | tipo HTML button            |
| `to`       | —        | `RouteLocationRaw`                                                                              | naviga con `router.push`    |
| `loading`  | `false`  | `boolean`                                                                                       | mostra spinner e disabilita |
| `icon`     | —        | `string`                                                                                        | icona Material Symbols      |
| `share`    | —        | `ShareLink`                                                                                     | condivide link al click     |

```vue
<script setup lang="ts">
import { Btn } from "cic-kit";
</script>

<template>
  <Btn color="primary">Salva</Btn>
</template>
```
