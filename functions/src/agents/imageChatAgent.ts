import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { type GeminiInlineImage, generateGeminiContent } from '../ai/geminiClient.js';
import { REGION } from '../config/runtime.js';
import { GEMINI_API_KEY } from '../config/secret.js';
import { requireUserPermission } from '../utils/auth.js';
import {
  readOptionalBoolean,
  readOptionalIntegerInRange,
  readRequiredString,
} from '../utils/validation.js';
import { buildAgentSystemInstruction, getAgentPromptConfig } from './agentPromptConfig.js';
import type { ChatHistoryItem } from './genericChatAgent.js';

export type ImageChatInputImage = {
  mimeType: string;
  dataBase64: string;
};

export type ImageChatAgentRequest = {
  message: string;
  history?: ChatHistoryItem[];
  images?: ImageChatInputImage[];
  generateImage?: boolean;
  imageCount?: number;
};

export type ImageChatAgentResponse = {
  text: string;
  images: ImageChatInputImage[];
  model: string;
};

const MAX_INPUT_IMAGES = 4;
const MAX_IMAGE_BASE64_LENGTH = 7_000_000;

export const imageChatAgent = onCall<ImageChatAgentRequest>(
  {
    region: REGION,
    secrets: [GEMINI_API_KEY],
  },
  async (request): Promise<ImageChatAgentResponse> => {
    await requireUserPermission(request, 'AI');

    const data = asObject(request.data);
    const message = readRequiredString(data, 'message', { maxLength: 4000 });
    const history = readHistory(data.history);
    const images = readInputImages(data.images);
    const generateImage = readOptionalBoolean(data.generateImage, false);
    const imageCount = readOptionalIntegerInRange(data.imageCount, 'imageCount', 1, 3, 1);

    const promptConfig = await getAgentPromptConfig('imageChatAgent');

    const output = await generateGeminiContent({
      model: promptConfig.model,
      systemInstruction: buildAgentSystemInstruction('imageChatAgent', promptConfig.prompt),
      userParts: [
        { text: buildUserPrompt(message, history, generateImage, imageCount, images.length) },
        ...images.map((image) => ({
          inlineData: {
            mimeType: image.mimeType,
            data: image.dataBase64,
          },
        })),
      ],
      maxOutputTokens: promptConfig.maxOutputTokens,
      temperature: promptConfig.temperature,
      responseModalities: generateImage ? ['TEXT', 'IMAGE'] : undefined,
    });

    const generatedImages = normalizeOutputImages(output.images, generateImage ? imageCount : 3);
    const text = output.text.trim();

    if (!text && !generatedImages.length) {
      throw new HttpsError('internal', 'Il modello non ha restituito contenuti utili.');
    }

    if (generateImage && !generatedImages.length) {
      throw new HttpsError(
        'failed-precondition',
        'Il modello non ha prodotto immagini. Verifica il model nel DB per imageChatAgent.',
      );
    }

    return {
      text,
      images: generatedImages,
      model: promptConfig.model,
    };
  },
);

function asObject(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new HttpsError('invalid-argument', 'Payload non valido.');
  }
  return input as Record<string, unknown>;
}

function readHistory(input: unknown): ChatHistoryItem[] {
  if (!Array.isArray(input)) return [];

  const normalized: ChatHistoryItem[] = [];

  for (const item of input) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;

    const record = item as Record<string, unknown>;
    const role = String(record.role ?? '').trim().toLowerCase();
    const text = String(record.text ?? '').trim();

    if ((role !== 'user' && role !== 'assistant') || !text) {
      continue;
    }

    normalized.push({
      role,
      text: text.slice(0, 1000),
    });
  }

  return normalized.slice(-12);
}

function readInputImages(input: unknown): ImageChatInputImage[] {
  if (!Array.isArray(input)) return [];

  const normalized: ImageChatInputImage[] = [];

  for (const item of input) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;

    const record = item as Record<string, unknown>;
    const mimeType = String(record.mimeType ?? '').trim().toLowerCase();
    const dataBase64 = String(record.dataBase64 ?? '').trim();

    if (!mimeType || !dataBase64) continue;
    if (!mimeType.startsWith('image/')) continue;
    if (dataBase64.length > MAX_IMAGE_BASE64_LENGTH) {
      throw new HttpsError('invalid-argument', 'Immagine troppo grande.');
    }

    normalized.push({ mimeType, dataBase64 });

    if (normalized.length >= MAX_INPUT_IMAGES) {
      break;
    }
  }

  return normalized;
}

function normalizeOutputImages(images: GeminiInlineImage[], maxImages: number) {
  if (!Array.isArray(images)) return [];

  const normalized: ImageChatInputImage[] = [];

  for (const image of images) {
    const mimeType = String(image?.mimeType ?? '').trim().toLowerCase();
    const dataBase64 = String(image?.dataBase64 ?? '').trim();

    if (!mimeType || !dataBase64) continue;
    if (!mimeType.startsWith('image/')) continue;

    normalized.push({ mimeType, dataBase64 });

    if (normalized.length >= maxImages) {
      break;
    }
  }

  return normalized;
}

function buildUserPrompt(
  message: string,
  history: ChatHistoryItem[],
  generateImage: boolean,
  imageCount: number,
  inputImageCount: number,
) {
  return [
    `Messaggio utente:\n${message}`,
    history.length ? `\nStorico recente (JSON):\n${JSON.stringify(history, null, 2)}` : '',
    `\nImmagini in input: ${inputImageCount}`,
    `Generazione immagini richiesta: ${generateImage ? 'si' : 'no'}`,
    generateImage ? `Numero immagini richieste: ${imageCount}` : '',
  ]
    .filter(Boolean)
    .join('\n')
    .trim();
}
