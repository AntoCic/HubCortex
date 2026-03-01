#### Integrazione Messaggi Progetto

Questa guida descrive il formato aggiornato dei messaggi progetto.
Il progetto destinatario viene identificato tramite `apiKey` (non tramite `projectId` nel messaggio).

### Struttura messaggio

```ts
type ProjectMessageInput = {
  typeMessage?: string;
  title?: string;
  message: string;
  payload?: Record<string, unknown>;
  sendPush?: boolean;
};
```

Note:
- `typeMessage` default: `info`
- tipi base disponibili: `error`, `warning`, `info`, `deploy`
- `sendPush` default: `true`
- se `typeMessage` e `deploy` e `payload.preview` contiene un URL HTTP/HTTPS, la UI mostra link preview e pulsante copia.

### Endpoint HTTP (integrazione esterna)

Metodo: `POST`  
URL:

```txt
https://europe-west1-hubcortex-33389.cloudfunctions.net/ingestProjectMessage
```

Autenticazione progetto:
- consigliato header `x-project-api-key: <PROJECT_API_KEY>`
- alternativa body `apiKey`

Body esempio:

```json
{
  "typeMessage": "deploy",
  "title": "Deploy Preview",
  "message": "Deploy preview completato",
  "payload": {
    "preview": "https://hubcortex--br-feature-123-abc.web.app",
    "branch": "feature/new-ui",
    "commit": "abc1234"
  },
  "sendPush": true
}
```

### Callable Firebase (uso interno UI)

Function: `publishProjectMessage`  
Input richiesto:

```ts
type PublishProjectMessageRequest = {
  apiKey: string;
  typeMessage?: string;
  title?: string;
  message: string;
  payload?: Record<string, unknown>;
  sendPush?: boolean;
};
```

### Esempio cURL rapido

```bash
curl -X POST "https://europe-west1-hubcortex-33389.cloudfunctions.net/ingestProjectMessage" \
  -H "Content-Type: application/json" \
  -H "x-project-api-key: <HUBCORTEX_API_KEY>" \
  -d '{
    "message": "Deploy preview completato",
    "typeMessage": "deploy",
    "payload": {
      "preview": "https://hubcortex--br-feature-123-abc.web.app"
    },
    "sendPush": true
  }'
```

### Risposta successo

```json
{
  "ok": true,
  "id": "generatedMessageId",
  "projectId": "targetProjectId",
  "typeMessage": "info",
  "sentUsers": 2,
  "sentTokens": 4
}
```

### Risposta errore

```json
{
  "ok": false,
  "error": "Messaggio errore"
}
```
