import { FirestoreModel, type Timestampble } from 'cic-kit';

const PROJECT_API_KEY_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
export const PROJECT_API_KEY_LENGTH = 24;

export const DEFAULT_PROJECT_MESSAGE_TYPES = ['error', 'warning', 'info'] as const;

export function normalizeMessageType(value: unknown) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_-]/g, '')
    .slice(0, 32);
}

export function normalizeProjectMessageTypes(value: unknown) {
  const set = new Set<string>(DEFAULT_PROJECT_MESSAGE_TYPES);

  if (Array.isArray(value)) {
    for (const item of value) {
      const normalized = normalizeMessageType(item);
      if (normalized) {
        set.add(normalized);
      }
    }
  }

  return [...set];
}

function randomInt(maxExclusive: number) {
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    const output = new Uint32Array(1);
    globalThis.crypto.getRandomValues(output);
    return Number(output[0] ?? 0) % maxExclusive;
  }

  return Math.floor(Math.random() * maxExclusive);
}

export function generateProjectApiKey(length = PROJECT_API_KEY_LENGTH) {
  const normalizedLength = Math.max(16, Math.min(64, Math.round(length || PROJECT_API_KEY_LENGTH)));
  let output = '';
  for (let i = 0; i < normalizedLength; i += 1) {
    output += PROJECT_API_KEY_ALPHABET[randomInt(PROJECT_API_KEY_ALPHABET.length)] ?? 'x';
  }
  return output;
}

function normalizeProjectApiKey(value: unknown) {
  const normalized = String(value ?? '').trim();
  if (normalized.length === PROJECT_API_KEY_LENGTH) {
    return normalized;
  }
  return generateProjectApiKey(PROJECT_API_KEY_LENGTH);
}

export interface ProjectData extends Partial<Timestampble> {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  repoUrl?: string;
  hostingUrl?: string;
  apiKey: string;
  typeMessage?: string[];
  createdBy?: string;
  updateBy: string;
}

export class Project extends FirestoreModel<ProjectData> {
  static collectionName = 'projects';

  name: string;
  description?: string;
  logoUrl?: string;
  repoUrl?: string;
  hostingUrl?: string;
  apiKey: string;
  typeMessage: string[];
  createdBy?: string;
  updateBy: string;

  constructor(data: ProjectData) {
    super(data);
    this.name = data.name;
    this.description = data.description;
    this.logoUrl = data.logoUrl;
    this.repoUrl = data.repoUrl;
    this.hostingUrl = data.hostingUrl;
    this.apiKey = normalizeProjectApiKey(data.apiKey);
    this.typeMessage = normalizeProjectMessageTypes(data.typeMessage);
    this.createdBy = data.createdBy;
    this.updateBy = data.updateBy;
  }

  toData(): ProjectData {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      logoUrl: this.logoUrl,
      repoUrl: this.repoUrl,
      hostingUrl: this.hostingUrl,
      apiKey: normalizeProjectApiKey(this.apiKey),
      typeMessage: normalizeProjectMessageTypes(this.typeMessage),
      createdBy: this.createdBy,
      updateBy: this.updateBy,
      ...this.timestampbleProps(),
    };
  }
}
