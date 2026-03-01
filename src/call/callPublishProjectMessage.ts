import { ensureFirebase, functions } from 'cic-kit';
import { httpsCallable } from 'firebase/functions';

export type PublishProjectMessageRequest = {
  apiKey: string;
  typeMessage?: string;
  title?: string;
  message: string;
  payload?: Record<string, unknown>;
  sendPush?: boolean;
};

export type PublishProjectMessageResponse = {
  id: string;
  typeMessage: string;
  sentUsers: number;
  sentTokens: number;
};

function getPublishProjectMessageCallable() {
  ensureFirebase();
  return httpsCallable<PublishProjectMessageRequest, PublishProjectMessageResponse>(
    functions,
    'publishProjectMessage',
  );
}

export async function callPublishProjectMessage(
  input: PublishProjectMessageRequest,
): Promise<PublishProjectMessageResponse> {
  const callable = getPublishProjectMessageCallable();
  const result = await callable(input);
  return result.data;
}
