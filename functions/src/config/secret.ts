// functions/src/config/secret.ts

import { defineSecret } from 'firebase-functions/params';
export const secret = {
    GEMINI_API_KEY: 'GEMINI_API_KEY',
    GITHUB_TOKEN: 'GITHUB_TOKEN',
} as const;

export const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');
export const GITHUB_TOKEN = defineSecret('GITHUB_TOKEN');
