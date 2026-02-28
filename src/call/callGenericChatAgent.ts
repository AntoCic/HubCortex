import { ensureFirebase, functions } from 'cic-kit';
import { httpsCallable } from 'firebase/functions';

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

function getGenericChatCallable() {
  ensureFirebase();
  return httpsCallable<GenericChatAgentRequest, GenericChatAgentResponse>(functions, 'genericChatAgent');
}

export async function callGenericChatAgent(input: GenericChatAgentRequest): Promise<GenericChatAgentResponse> {
  const callable = getGenericChatCallable();
  const result = await callable(input);
  return result.data;
}
