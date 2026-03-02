import {
  callPublishProjectMessage,
  type PublishProjectMessageRequest,
  type PublishProjectMessageResponse,
  setProjectMessageRelayApiKey,
  setProjectMessageRelayApiKeyResolver,
} from './callProjectMessageRelay'

type JsonRecord = Record<string, unknown>

export type HubTypeMessage = 'info' | 'warning' | 'error' | 'deploy' | (string & {})

export type HubMessageInput = {
  apiKey?: string
  title?: string
  message: string
  payload?: JsonRecord
  sendPush?: boolean
}

export type HubMessageValue = string | HubMessageInput

function normalizeOptional(value: string | undefined) {
  const normalized = String(value ?? '').trim()
  return normalized || undefined
}

function normalizeRequiredMessage(value: string | undefined) {
  const normalized = String(value ?? '').trim()
  if (!normalized) {
    throw new Error('hub message is required')
  }
  return normalized
}

function buildRequest(typeMessage: HubTypeMessage, value: HubMessageValue): PublishProjectMessageRequest {
  if (typeof value === 'string') {
    return {
      typeMessage,
      message: normalizeRequiredMessage(value),
    }
  }

  return {
    apiKey: normalizeOptional(value.apiKey),
    typeMessage,
    title: normalizeOptional(value.title),
    message: normalizeRequiredMessage(value.message),
    payload: value.payload,
    sendPush: value.sendPush,
  }
}

async function send(typeMessage: HubTypeMessage, value: HubMessageValue): Promise<PublishProjectMessageResponse> {
  return callPublishProjectMessage(buildRequest(typeMessage, value))
}

export const hub = {
  send,
  info(value: HubMessageValue) {
    return send('info', value)
  },
  warning(value: HubMessageValue) {
    return send('warning', value)
  },
  warn(value: HubMessageValue) {
    return send('warning', value)
  },
  error(value: HubMessageValue) {
    return send('error', value)
  },
  deploy(value: HubMessageValue) {
    return send('deploy', value)
  },
}

export { setProjectMessageRelayApiKey, setProjectMessageRelayApiKeyResolver }

