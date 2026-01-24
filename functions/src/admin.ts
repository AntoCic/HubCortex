// functions/src/libs/admin.ts
import { getApps, initializeApp, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

const app: App = getApps().length ? getApps()[0] : initializeApp();
export const db = getFirestore(app);
export const messaging = getMessaging(app);
