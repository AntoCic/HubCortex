import { reactive } from 'vue';
import { FirestoreStore } from 'cic-kit';
import { AgentPrompt, type AgentPromptData } from '../models/AgentPrompt';

class AgentPromptStore extends FirestoreStore<AgentPrompt, AgentPromptData> {
  constructor() {
    super(AgentPrompt);
  }
}

export const agentPromptStore = reactive(new AgentPromptStore());
