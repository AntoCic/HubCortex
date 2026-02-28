#### LS

Wrapper tipizzato e robusto per localStorage con gestione errori e toast.

| prop        | default | type                                                 | utilizzo           |
| ----------- | ------- | ---------------------------------------------------- | ------------------ |
| `getStr`    | —       | `(key: LocalStorageKeyType) => string \| undefined`  | legge valore raw   |
| `getParsed` | —       | `(key: LocalStorageKeyType) => any`                  | parse JSON sicuro  |
| `set`       | —       | `(key: LocalStorageKeyType, value: any) => any`      | salva serializzato |
| `update`    | —       | `(key: LocalStorageKeyType, data: any) => any`       | merge o push       |
| `push`      | —       | `(key: LocalStorageKeyType, ...items: any[]) => any` | aggiunge ad array  |
| `remove`    | —       | `(key: LocalStorageKeyType) => void`                 | rimuove chiave     |
| `delete`    | —       | `(key: LocalStorageKeyType) => void`                 | alias remove       |
| `has`       | —       | `(key: LocalStorageKeyType) => boolean`              | verifica esistenza |
| `keys`      | —       | `() => LocalStorageKeyType[]`                        | chiavi enum        |
| `clearAll`  | —       | `() => void`                                         | pulizia storage    |
| `migrate`   | —       | `(oldKey, newKey) => void`                           | migrazione valore  |

```vue
<script setup lang="ts">
import { LS } from "@/shared/utils/LS";
import { LocalStorageKey } from "@shared/enums/LocalStorageKey";

LS.set(LocalStorageKey.User, { name: "Mario" });
const user = LS.getParsed(LocalStorageKey.User);
</script>
```
