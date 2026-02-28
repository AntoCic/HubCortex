import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { generateGeminiContent } from '../ai/geminiClient.js';
import { REGION } from '../config/runtime.js';
import { GEMINI_API_KEY } from '../config/secret.js';
import { requireUserPermission } from '../utils/auth.js';
import { readRequiredString } from '../utils/validation.js';
import { buildAgentSystemInstruction, getAgentPromptConfig } from './agentPromptConfig.js';

export type ChatHistoryItem = {
  role: 'user' | 'assistant';
  text: string;
};

export type GenericChatAgentRequest = {
  message: string;
  history?: ChatHistoryItem[];
  context?: Record<string, unknown>;
};

export type GenericChatAgentResponse = {
  text: string;
  model: string;
};

export const genericChatAgent = onCall<GenericChatAgentRequest>(
  {
    region: REGION,
    secrets: [GEMINI_API_KEY],
  },
  async (request): Promise<GenericChatAgentResponse> => {
    await requireUserPermission(request, 'AI');

    const data = asObject(request.data);
    const message = readRequiredString(data, 'message', { maxLength: 4000 });
    const history = readHistory(data.history);
    const context = asOptionalObject(data.context);

    const promptConfig = await getAgentPromptConfig('genericChatAgent');

    const output = await generateGeminiContent({
      model: promptConfig.model,
      systemInstruction: buildAgentSystemInstruction('genericChatAgent', promptConfig.prompt),
      userParts: [{ text: buildUserPrompt(message, history, context) }],
      maxOutputTokens: promptConfig.maxOutputTokens,
      temperature: promptConfig.temperature,
    });

    const text = output.text.trim();
    if (!text) {
      throw new HttpsError('internal', 'Il modello non ha restituito testo.');
    }

    return {
      text,
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

function asOptionalObject(input: unknown) {
  if (input == null) return undefined;
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new HttpsError('invalid-argument', 'context deve essere un oggetto.');
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

function buildUserPrompt(
  message: string,
  history: ChatHistoryItem[],
  context?: Record<string, unknown>,
) {
  return [
    'Messaggio utente:',
    message,
    history.length
      ? `\nStorico recente (JSON):\n${JSON.stringify(history, null, 2)}`
      : '',
    context ? `\nContesto extra (JSON):\n${JSON.stringify(context, null, 2)}` : '',
  ]
    .filter(Boolean)
    .join('\n')
    .trim();
}
