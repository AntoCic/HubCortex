#### ToastStore

Store reattivo per creare, gestire e rimuovere toast (queue + timer).

| prop              | default | type                           | utilizzo                   |
| ----------------- | ------- | ------------------------------ | -------------------------- |
| `queue`           | `[]`    | `Toast[]`                      | lista toast attivi         |
| `info`            | —       | `(content, duration?) => void` | toast informativo          |
| `success`         | —       | `(content, duration?) => void` | toast successo             |
| `warning`         | —       | `(content, duration?) => void` | toast warning              |
| `error`           | —       | `(content, duration?) => void` | toast errore (+log in DEV) |
| `danger`          | —       | `(content, duration?) => void` | alias di `error`           |
| `primary`         | —       | `(content, duration?) => void` | variante primary           |
| `secondary`       | —       | `(content, duration?) => void` | variante secondary         |
| `log`             | —       | `(content, duration?) => void` | solo DEV, default 5000ms   |
| `logError`        | —       | `(content, duration?) => void` | solo DEV, default 5000ms   |
| `start`           | —       | `(toast: Toast) => void`       | avvia timer rimozione      |
| `stop`            | —       | `(toast: Toast) => void`       | pausa timer e ricalcolo    |
| `removeToastById` | —       | `(id: string) => void`         | rimuove per id             |

```vue
<script setup lang="ts">
import { toast } from "@/stores/toast";
</script>

<template>
  <button type="button" @click="toast.success("Operazione completata")">Mostra toast</button>
</template>
```
