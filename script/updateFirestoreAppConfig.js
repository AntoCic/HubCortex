import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const packageJsonPath = './package.json';
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

export async function updateFirestoreAppConfig() {
    const appName = packageJson.name;
    const appVersion = packageJson.version;
    const docId = String(appName).replaceAll('/', '_');

    if (
        !appName ||
        !appVersion ||
        appName.trim().length === 0 ||
        appVersion === '0.0.0'
    ) {
        throw new Error('Nome o versione app non trovati in package.json');
    }

    const require = createRequire(import.meta.url);
    const admin = require(
        path.resolve('./functions/node_modules/firebase-admin')
    );

    const projectId = 'gamescore-cic';

    // 📌 carica service account locale
    const serviceAccountPath = path.resolve('./script/firebase-adminsdk.json');

    if (!fs.existsSync(serviceAccountPath)) {
        throw new Error(`Service account non trovato: ${serviceAccountPath}`);
    }

    const serviceAccount = JSON.parse(
        fs.readFileSync(serviceAccountPath, 'utf-8')
    );

    if (!admin.apps?.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId,
        });
    }

    const db = admin.firestore();

    await db.collection('appConfig').doc(docId).set(
        {
            appName,
            lastVersion: appVersion,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            source: 'update-version-db',
        },
        { merge: true }
    );

    console.log(
        `✅ Firestore aggiornato: /appConfig/${docId} lastVersion=${appVersion}`
    );
}

