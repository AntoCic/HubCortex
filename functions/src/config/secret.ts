// functions/src/config/secret.ts

import { defineSecret } from 'firebase-functions/params';
export const secret = {
    GEMINI_API_KEY: 'GEMINI_API_KEY',
} as const;


export const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');
