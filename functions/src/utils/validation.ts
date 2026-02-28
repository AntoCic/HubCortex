import { HttpsError } from 'firebase-functions/v2/https';

type StringOptions = {
  minLength?: number;
  maxLength?: number;
};

export function readRequiredString(
  input: Record<string, unknown>,
  key: string,
  options: StringOptions = {},
) {
  const raw = input[key];
  const value = typeof raw === 'string' ? raw.trim() : '';
  if (!value) {
    throw new HttpsError('invalid-argument', `Campo "${key}" obbligatorio.`);
  }
  if (options.minLength && value.length < options.minLength) {
    throw new HttpsError('invalid-argument', `Campo "${key}" troppo corto.`);
  }
  if (options.maxLength && value.length > options.maxLength) {
    throw new HttpsError('invalid-argument', `Campo "${key}" troppo lungo.`);
  }
  return value;
}

export function readOptionalString(
  input: Record<string, unknown>,
  key: string,
  options: StringOptions = {},
) {
  const raw = input[key];
  if (raw == null || raw === '') return undefined;
  if (typeof raw !== 'string') {
    throw new HttpsError('invalid-argument', `Campo "${key}" deve essere una stringa.`);
  }
  const value = raw.trim();
  if (!value) return undefined;
  if (options.minLength && value.length < options.minLength) {
    throw new HttpsError('invalid-argument', `Campo "${key}" troppo corto.`);
  }
  if (options.maxLength && value.length > options.maxLength) {
    throw new HttpsError('invalid-argument', `Campo "${key}" troppo lungo.`);
  }
  return value;
}

export function readOptionalBoolean(raw: unknown, fallback: boolean) {
  if (raw == null || raw === '') return fallback;
  if (typeof raw === 'boolean') return raw;

  const normalized = String(raw).trim().toLowerCase();
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;

  throw new HttpsError('invalid-argument', 'Valore booleano non valido.');
}

export function readRecommendationLimit(raw: unknown) {
  if (raw == null || raw === '') return 3;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed)) {
    throw new HttpsError('invalid-argument', 'limit deve essere un numero intero.');
  }
  if (parsed < 1 || parsed > 3) {
    throw new HttpsError('invalid-argument', 'limit deve essere tra 1 e 3.');
  }
  return parsed;
}

export function readOptionalIntegerInRange(
  raw: unknown,
  key: string,
  min: number,
  max: number,
  fallback: number,
) {
  if (raw == null || raw === '') return fallback;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed)) {
    throw new HttpsError('invalid-argument', `${key} deve essere un numero intero.`);
  }
  if (parsed < min || parsed > max) {
    throw new HttpsError('invalid-argument', `${key} deve essere tra ${min} e ${max}.`);
  }
  return parsed;
}
