import { cicInit } from 'cic-kit-firebase-functions';
import { genericChatAgent } from './agents/genericChatAgent.js';
import { imageChatAgent } from './agents/imageChatAgent.js';
import { REGION } from './config/runtime.js';
import {
  createProjectTask,
  createProjectTaskBranch,
  deleteProjectTaskBranch,
  ingestProjectMessage,
  listGitHubRepositories,
  publishProjectMessage,
} from './features/projects/projectOps.js';

const { sendUserPush, syncPublicUser } = cicInit({
  region: REGION,
  https: { cors: true },
});

export {
  sendUserPush,
  syncPublicUser,
  genericChatAgent,
  imageChatAgent,
  createProjectTask,
  createProjectTaskBranch,
  deleteProjectTaskBranch,
  listGitHubRepositories,
  publishProjectMessage,
  ingestProjectMessage,
};
