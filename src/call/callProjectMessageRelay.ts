import {
  callPublishProjectMessage as callPublishProjectMessageBase,
  type PublishProjectMessageRequest as PublishProjectMessageRequestBase,
  type PublishProjectMessageResponse,
} from './callPublishProjectMessage'

export type { PublishProjectMessageResponse }

export type PublishProjectMessageRequest = Omit<PublishProjectMessageRequestBase, 'apiKey'> & {
  apiKey?: string
}

type ApiKeyResolver = () => string | undefined

let relayApiKeyResolver: ApiKeyResolver | undefined

function normalizeApiKey(value: unknown) {
  const normalized = String(value ?? '').trim()
  return normalized || undefined
}

function resolveApiKey(explicitApiKey: unknown) {
  const explicit = normalizeApiKey(explicitApiKey)
  if (explicit) {
    return explicit
  }

  const fromResolver = normalizeApiKey(relayApiKeyResolver?.())
  if (fromResolver) {
    return fromResolver
  }

  throw new Error('Project API key non disponibile per invio messaggio.')
}

export function setProjectMessageRelayApiKeyResolver(resolver?: ApiKeyResolver | null) {
  relayApiKeyResolver = resolver ?? undefined
}

export function setProjectMessageRelayApiKey(apiKey?: string | null) {
  const normalized = normalizeApiKey(apiKey)
  if (!normalized) {
    relayApiKeyResolver = undefined
    return
  }

  relayApiKeyResolver = () => normalized
}

export async function callPublishProjectMessage(
  input: PublishProjectMessageRequest,
): Promise<PublishProjectMessageResponse> {
  const apiKey = resolveApiKey(input.apiKey)
  const result = await callPublishProjectMessageBase({
    ...input,
    apiKey,
  })
  return result
}
