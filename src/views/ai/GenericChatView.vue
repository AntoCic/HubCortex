<script setup lang="ts">
import { toast, useChangeHeader } from 'cic-kit';
import { computed, ref } from 'vue';
import { callGenericChatAgent, type ChatHistoryItem } from '../../call/callGenericChatAgent';
import AppCard from '../../components/ui/AppCard.vue';

useChangeHeader('Chat AI', { name: 'home' });

const draftMessage = ref('');
const messages = ref<ChatHistoryItem[]>([]);
const model = ref('');
const isSending = ref(false);

const canSend = computed(() => !isSending.value && draftMessage.value.trim().length > 0);

async function sendMessage() {
  const message = draftMessage.value.trim();
  if (!message || isSending.value) return;

  isSending.value = true;

  try {
    const response = await callGenericChatAgent({
      message,
      history: messages.value,
    });

    messages.value = [
      ...messages.value,
      { role: 'user', text: message },
      { role: 'assistant', text: response.text },
    ];

    model.value = response.model;
    draftMessage.value = '';
  } catch (error) {
    toast.error(readErrorMessage(error));
  } finally {
    isSending.value = false;
  }
}

function clearChat() {
  draftMessage.value = '';
  messages.value = [];
  model.value = '';
}

function readErrorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message?: unknown }).message ?? 'Errore durante la chiamata agente.');
  }

  return 'Errore durante la chiamata agente.';
}
</script>

<template>
  <div class="container pb-t overflow-auto h-100">
    <AppCard class="p-3 mb-3">
      <h1 class="h5 mb-1">Test genericChatAgent</h1>
      <div class="small text-secondary" v-if="model">Model: {{ model }}</div>
    </AppCard>

    <AppCard class="p-3 mb-3">
      <label class="form-label">Messaggio</label>
      <textarea
        v-model="draftMessage"
        class="form-control mb-3"
        rows="4"
        placeholder="Scrivi una richiesta per il modello..."
      />

      <div class="d-flex gap-2">
        <button class="btn btn-primary" :disabled="!canSend" @click="sendMessage">
          {{ isSending ? 'Invio...' : 'Invia' }}
        </button>
        <button class="btn btn-outline-secondary" @click="clearChat">Reset</button>
      </div>
    </AppCard>

    <AppCard class="p-3">
      <h2 class="h6 mb-3">Conversazione</h2>

      <div v-if="!messages.length" class="text-secondary">Nessun messaggio.</div>

      <div v-else class="d-flex flex-column gap-2">
        <div
          v-for="(item, index) in messages"
          :key="`${item.role}-${index}`"
          class="p-2 rounded"
          :class="item.role === 'user' ? 'bg-light border' : 'bg-white border border-primary-subtle'"
        >
          <div class="small text-uppercase text-secondary">{{ item.role }}</div>
          <div class="mb-0" style="white-space: pre-wrap">{{ item.text }}</div>
        </div>
      </div>
    </AppCard>
  </div>
</template>
