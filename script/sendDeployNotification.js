import { execSync } from 'child_process';

const DEFAULT_PROJECT_ID = 'hubcortex-33389';
const DEFAULT_INGEST_URL = 'https://europe-west1-hubcortex-33389.cloudfunctions.net/ingestProjectMessage';
const RELEASE_MESSAGE = 'E stata rilasciata la nuova versione';

function readApiKeyFromEnv() {
  return String(process.env.HUBCORTEX_API_KEY ?? '').trim();
}

function readApiKeyFromFirebaseSecret(projectId) {
  try {
    const output = execSync(`firebase functions:secrets:access HUBCORTEX_API_KEY --project ${projectId}`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const lines = String(output ?? '')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    const candidate = (lines[lines.length - 1] ?? '').replace(/^"+|"+$/g, '').trim();
    return candidate;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Impossibile leggere il secret HUBCORTEX_API_KEY: ${message}`);
  }
}

async function sendReleaseNotification({ apiKey, ingestUrl }) {
  const response = await fetch(ingestUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-project-api-key': apiKey,
    },
    body: JSON.stringify({
      typeMessage: 'info',
      message: RELEASE_MESSAGE,
      sendPush: true,
    }),
  });

  const raw = await response.text();
  let payload = {};
  try {
    payload = raw ? JSON.parse(raw) : {};
  } catch {
    payload = {};
  }

  if (!response.ok) {
    const errorMessage =
      payload && typeof payload === 'object' && 'error' in payload
        ? String((payload).error ?? 'Errore sconosciuto.')
        : `HTTP ${response.status}`;
    throw new Error(`Invio notifica deploy fallito: ${errorMessage}`);
  }

  return payload;
}

async function main() {
  const projectId = String(process.env.FIREBASE_PROJECT_ID ?? DEFAULT_PROJECT_ID).trim() || DEFAULT_PROJECT_ID;
  const ingestUrl = String(process.env.HUBCORTEX_INGEST_URL ?? DEFAULT_INGEST_URL).trim() || DEFAULT_INGEST_URL;
  const apiKey = readApiKeyFromEnv() || readApiKeyFromFirebaseSecret(projectId);

  if (!apiKey) {
    throw new Error('HUBCORTEX_API_KEY non disponibile (env e secret vuoti).');
  }

  const result = await sendReleaseNotification({ apiKey, ingestUrl });
  const type = String(result && typeof result === 'object' && 'typeMessage' in result ? result.typeMessage : 'info');
  const messageId = String(result && typeof result === 'object' && 'id' in result ? result.id : '');
  console.log(`Notifica deploy inviata. typeMessage=${type}${messageId ? ` id=${messageId}` : ''}`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
