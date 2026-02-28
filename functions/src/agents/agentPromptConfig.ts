import { db } from '../config/firebaseAdmin.js';
import { DEFAULT_GEMINI_MODEL } from '../config/runtime.js';

export const AGENT_PROMPT_COLLECTION = 'agentPrompts';
export const AGENT_PROMPT_IDS = ['genericChatAgent', 'imageChatAgent'] as const;

export type AgentPromptId = (typeof AGENT_PROMPT_IDS)[number];

export type AgentPromptRuntimeConfig = {
  model: string;
  prompt: string;
  maxOutputTokens: number;
  temperature: number;
};

const DEFAULT_MAX_OUTPUT_TOKENS = 1400;
const DEFAULT_TEMPERATURE = 0.35;

const DEFAULT_AGENT_PROMPTS: Record<AgentPromptId, AgentPromptRuntimeConfig> = {
  genericChatAgent: {
    model: DEFAULT_GEMINI_MODEL,
    prompt: [
      'Sei un assistente operativo per la gestione di progetti software.',
      'Rispondi in italiano in modo chiaro e sintetico.',
      'Quando utile, proponi passi pratici e verificabili.',
    ].join('\n'),
    maxOutputTokens: DEFAULT_MAX_OUTPUT_TOKENS,
    temperature: DEFAULT_TEMPERATURE,
  },
  imageChatAgent: {
    model: 'gemini-2.0-flash-preview-image-generation',
    prompt: [
      'Sei un assistente multimodale per testo e immagini.',
      'Analizza le immagini fornite e rispondi in italiano.',
      'Se richiesto esplicitamente, genera immagini coerenti con la richiesta.',
    ].join('\n'),
    maxOutputTokens: DEFAULT_MAX_OUTPUT_TOKENS,
    temperature: DEFAULT_TEMPERATURE,
  },
};

export async function getAgentPromptConfig(agentId: AgentPromptId): Promise<AgentPromptRuntimeConfig> {
  const defaults = DEFAULT_AGENT_PROMPTS[agentId];

  try {
    const snapshot = await db.collection(AGENT_PROMPT_COLLECTION).doc(agentId).get();
    if (!snapshot.exists) {
      return defaults;
    }

    const data = snapshot.data() as Record<string, unknown>;

    return {
      model: normalizeModel(data.model, defaults.model),
      prompt: normalizePrompt(data.prompt, defaults.prompt),
      maxOutputTokens: normalizeTokens(data.tokens, defaults.maxOutputTokens),
      temperature: normalizeTemperature(data.temperature, defaults.temperature),
    };
  } catch (error) {
    console.error(`Unable to load ${agentId} prompt config`, error);
    return defaults;
  }
}

export function buildAgentSystemInstruction(agentId: AgentPromptId, prompt: string) {
  const basePrompt = String(prompt ?? '').trim();

  const lines: string[] = [];
  if (basePrompt) {
    lines.push(basePrompt);
  }

  lines.push('Rispondi sempre in italiano.');

  if (agentId === 'genericChatAgent') {
    lines.push('Mantieni una risposta concreta e orientata all\'azione.');
  }

  if (agentId === 'imageChatAgent') {
    lines.push('Quando sono presenti immagini in input, usale come contesto prioritario.');
    lines.push('Quando l\'utente chiede di generare immagini, fornisci anche una breve descrizione testuale del risultato.');
  }

  return lines.join('\n').trim();
}

function normalizeModel(value: unknown, fallback: string) {
  const normalized = String(value ?? '').trim();
  return normalized || fallback;
}

function normalizePrompt(value: unknown, fallback: string) {
  const normalized = String(value ?? '').trim();
  return normalized || fallback;
}

function normalizeTokens(value: unknown, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;

  const rounded = Math.round(parsed);
  if (rounded < 1) return 1;
  if (rounded > 8192) return 8192;
  return rounded;
}

function normalizeTemperature(value: unknown, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;

  if (parsed < 0) return 0;
  if (parsed > 1) return 1;
  return Number(parsed.toFixed(2));
}
