import { cicInit } from 'cic-kit-firebase-functions';
import { genericChatAgent } from './agents/genericChatAgent.js';
import { imageChatAgent } from './agents/imageChatAgent.js';
import { REGION } from './config/runtime.js';

const { sendUserPush, syncPublicUser } = cicInit({
  region: REGION,
  https: { cors: true },
});

export { sendUserPush, syncPublicUser, genericChatAgent, imageChatAgent };
