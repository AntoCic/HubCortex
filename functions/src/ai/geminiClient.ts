import { HttpsError } from 'firebase-functions/v2/https';
import { DEFAULT_GEMINI_MODEL } from '../config/runtime.js';
import { GEMINI_API_KEY } from '../config/secret.js';

export type GeminiInlineImage = {
  mimeType: string;
  dataBase64: string;
};

type GeminiRequestPart = {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
};

type GeminiResponsePart = {
  text?: string;
  inlineData?: {
    mimeType?: string;
    data?: string;
  };
};

type GeminiCandidate = {
  content?: {
    parts?: GeminiResponsePart[];
  };
};

type GeminiApiError = {
  code?: number;
  message?: string;
  status?: string;
};

type GeminiApiResponse = {
  candidates?: GeminiCandidate[];
  error?: GeminiApiError;
};

export type GenerateGeminiContentInput = {
  model: string;
  systemInstruction?: string;
  userParts: GeminiRequestPart[];
  maxOutputTokens?: number;
  temperature?: number;
  responseModalities?: Array<'TEXT' | 'IMAGE'>;
};

export type GenerateGeminiContentOutput = {
  text: string;
  images: GeminiInlineImage[];
};

const DEFAULT_MAX_OUTPUT_TOKENS = 1200;
const MAX_OUTPUT_TOKENS = 8192;

export async function generateGeminiContent(
  input: GenerateGeminiContentInput,
): Promise<GenerateGeminiContentOutput> {
  const apiKey = GEMINI_API_KEY.value();
  if (!apiKey) {
    throw new HttpsError('failed-precondition', 'Missing GEMINI_API_KEY secret.');
  }

  const endpoint =
    `https://generativelanguage.googleapis.com/v1beta/models/` +
    `${encodeURIComponent(normalizeModel(input.model))}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const userParts = normalizeUserParts(input.userParts);
  if (!userParts.length) {
    throw new HttpsError('invalid-argument', 'Prompt vuoto.');
  }

  const body: Record<string, unknown> = {
    contents: [{ role: 'user', parts: userParts }],
    generationConfig: {
      temperature: normalizeTemperature(input.temperature),
      maxOutputTokens: normalizeTokens(input.maxOutputTokens),
    },
  };

  const systemInstruction = String(input.systemInstruction ?? '').trim();
  if (systemInstruction) {
    body.systemInstruction = {
      role: 'system',
      parts: [{ text: systemInstruction }],
    };
  }

  if (Array.isArray(input.responseModalities) && input.responseModalities.length) {
    (body.generationConfig as Record<string, unknown>).responseModalities = [...new Set(input.responseModalities)];
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const payload = (await response.json()) as GeminiApiResponse;
  if (!response.ok || payload.error) {
    throw new HttpsError(
      'internal',
      payload.error?.message ?? 'Gemini request failed.',
      payload.error ?? undefined,
    );
  }

  const parts = payload.candidates?.[0]?.content?.parts ?? [];
  const text = collectText(parts);
  const images = collectImages(parts);

  return { text, images };
}

function normalizeModel(model: string) {
  const normalized = String(model ?? '').trim();
  if (!normalized) return DEFAULT_GEMINI_MODEL;
  return normalized.startsWith('models/') ? normalized.slice(7) : normalized;
}

function normalizeUserParts(parts: GeminiRequestPart[]) {
  if (!Array.isArray(parts)) return [];

  const normalized: GeminiRequestPart[] = [];

  for (const part of parts) {
    if (!part || typeof part !== 'object') continue;

    const text = typeof part.text === 'string' ? part.text.trim() : '';
    if (text) {
      normalized.push({ text });
    }

    const inlineData = part.inlineData;
    const mimeType = String(inlineData?.mimeType ?? '').trim();
    const data = String(inlineData?.data ?? '').trim();
    if (mimeType && data) {
      normalized.push({
        inlineData: {
          mimeType,
          data,
        },
      });
    }
  }

  return normalized;
}

function normalizeTokens(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_MAX_OUTPUT_TOKENS;
  const rounded = Math.round(parsed);
  if (rounded < 1) return 1;
  if (rounded > MAX_OUTPUT_TOKENS) return MAX_OUTPUT_TOKENS;
  return rounded;
}

function normalizeTemperature(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0.3;
  if (parsed < 0) return 0;
  if (parsed > 1) return 1;
  return Number(parsed.toFixed(2));
}

function collectText(parts: GeminiResponsePart[]) {
  return parts
    .map((part) => String(part?.text ?? '').trim())
    .filter(Boolean)
    .join('\n')
    .trim();
}

function collectImages(parts: GeminiResponsePart[]) {
  const images: GeminiInlineImage[] = [];

  for (const part of parts) {
    const mimeType = String(part?.inlineData?.mimeType ?? '').trim();
    const dataBase64 = String(part?.inlineData?.data ?? '').trim();
    if (!mimeType || !dataBase64) continue;
    if (!mimeType.startsWith('image/')) continue;

    images.push({ mimeType, dataBase64 });
  }

  return images;
}
