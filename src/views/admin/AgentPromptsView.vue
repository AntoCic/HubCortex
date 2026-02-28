<script setup lang="ts">
import { _Auth, toast, useChangeHeader } from 'cic-kit';
import { computed, onMounted } from 'vue';
import {
  AGENT_PROMPT_DEFAULTS,
  AGENT_PROMPT_IDS,
  AGENT_PROMPT_LABELS,
  type AgentPrompt,
  type AgentPromptId,
} from '../../models/AgentPrompt';
import { agentPromptStore } from '../../stores/agentPromptStore';

useChangeHeader('Prompt AI', { name: 'home-auth' });

const promptItems = computed(() =>
  AGENT_PROMPT_IDS.map((id) => agentPromptStore.items[id]).filter(Boolean) as AgentPrompt[],
);

onMounted(async () => {
  await agentPromptStore.get();

  for (const id of AGENT_PROMPT_IDS) {
    if (agentPromptStore.items[id]) continue;
    const defaults = AGENT_PROMPT_DEFAULTS[id];

    await agentPromptStore.add({
      id,
      prompt: defaults.prompt,
      model: defaults.model,
      tokens: defaults.tokens,
      temperature: defaults.temperature,
      updateBy: getUpdater(),
    });
  }

  await agentPromptStore.get();
});

function getUpdater() {
  return String(_Auth?.uid ?? 'system');
}

function getPromptLabel(id: string) {
  if (!AGENT_PROMPT_IDS.includes(id as AgentPromptId)) return id;
  return AGENT_PROMPT_LABELS[id as AgentPromptId];
}

async function savePrompt(prompt: AgentPrompt) {
  await prompt.update({
    prompt: prompt.prompt,
    model: prompt.model,
    tokens: prompt.tokens,
    temperature: prompt.temperature,
    updateBy: getUpdater(),
  });

  toast.success('Prompt aggiornato.');
}
</script>

<template>
  <div class="container page-wrap">
    <div class="card card-hub p-3 mb-3">
      <h1 class="h5 mb-0">Configurazione Prompt AI</h1>
    </div>

    <div class="row g-3">
      <div class="col-12" v-for="prompt in promptItems" :key="prompt.id">
        <div class="card card-hub p-3">
          <h2 class="h6">{{ getPromptLabel(prompt.id) }}</h2>

          <div class="row g-2 mb-2">
            <div class="col-12 col-md-4">
              <label class="form-label small">Model</label>
              <input v-model="prompt.model" class="form-control" />
            </div>
            <div class="col-6 col-md-4">
              <label class="form-label small">Tokens</label>
              <input v-model.number="prompt.tokens" type="number" min="1" max="8192" class="form-control" />
            </div>
            <div class="col-6 col-md-4">
              <label class="form-label small">Temperature</label>
              <input v-model.number="prompt.temperature" type="number" min="0" max="1" step="0.01" class="form-control" />
            </div>
          </div>

          <label class="form-label small">Prompt</label>
          <textarea v-model="prompt.prompt" class="form-control mb-3" rows="8" />

          <div>
            <button class="btn btn-hub-primary" @click="savePrompt(prompt)">Salva</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
