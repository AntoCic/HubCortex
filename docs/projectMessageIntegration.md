#### Integrazione Messaggi Progetto (Cross-Project)

Questa guida spiega come un altro progetto Firebase puo inviare messaggi a HubCortex usando la `apiKey` del progetto destinatario.

### Endpoint

Metodo: `POST`  
URL:

```txt
https://<FUNCTION_REGION>-<HUBCORTEX_PROJECT_ID>.cloudfunctions.net/ingestProjectMessage
```

Esempio (se region `europe-west1`):

```txt
https://europe-west1-hubcortex-33389.cloudfunctions.net/ingestProjectMessage
```

### Autenticazione

Passa la chiave progetto nel header:

```txt
x-project-api-key: <PROJECT_API_KEY>
```

In alternativa puoi inviarla nel body (`apiKey`), ma l'header e consigliato.

### Payload minimo

```json
{
  "message": "Deploy completato su production"
}
```

### Payload completo

```json
{
  "apiKey": "PROJECT_API_KEY_OPTIONAL_IF_HEADER_PRESENT",
  "typeMessage": "deployment",
  "title": "Release v2.3.1",
  "message": "Deploy completato, 0 errori critici.",
  "taskId": "task_abc123",
  "sourceProjectId": "my-other-project",
  "sourceLabel": "My Other Firebase Project",
  "sendPush": true,
  "updateBy": "external-ci",
  "payload": {
    "env": "production",
    "commit": "a1b2c3d4",
    "pipelineUrl": "https://ci.example.com/job/123"
  }
}
```

### Tipi messaggio

Tipi default:
- `error`
- `warning`
- `info`

Puoi inviare anche tipi custom (`deployment`, `billing`, `security`, ecc.).  
Se il tipo non esiste ancora nel progetto destinatario, viene aggiunto automaticamente a `typeMessage`.

### Esempio cURL

```bash
curl -X POST "https://europe-west1-hubcortex-33389.cloudfunctions.net/ingestProjectMessage" \
  -H "Content-Type: application/json" \
  -H "x-project-api-key: <PROJECT_API_KEY>" \
  -d '{
    "typeMessage": "deployment",
    "title": "Deploy prod",
    "message": "Deploy completato con successo",
    "sourceLabel": "CI Pipeline",
    "sendPush": true
  }'
```

### Risposta

Successo:

```json
{
  "ok": true,
  "id": "generatedMessageId",
  "projectId": "targetProjectId",
  "typeMessage": "deployment",
  "sentUsers": 2,
  "sentTokens": 4
}
```

Errore:

```json
{
  "ok": false,
  "error": "Messaggio errore"
}
```
