// functions/src/config/env.ts
import type { SupportedRegion } from 'firebase-functions/v2/options';

export const REGION: SupportedRegion = 'europe-west1';

export const httpsDefaults = { region: REGION, cors: true } as const;