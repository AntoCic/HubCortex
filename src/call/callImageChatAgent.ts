import { ensureFirebase, functions } from 'cic-kit';
import { httpsCallable } from 'firebase/functions';

export type ChatHistoryItem = {
  role: 'user' | 'assistant';
  text: string;
};

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

function getImageChatCallable() {
  ensureFirebase();
  return httpsCallable<ImageChatAgentRequest, ImageChatAgentResponse>(functions, 'imageChatAgent');
}

export async function callImageChatAgent(input: ImageChatAgentRequest): Promise<ImageChatAgentResponse> {
  const callable = getImageChatCallable();
  const result = await callable(input);
  return result.data;
}
