<script setup lang="ts">
import { toast, useChangeHeader } from 'cic-kit';
import { computed, ref } from 'vue';
import {
  callImageChatAgent,
  type ChatHistoryItem,
  type ImageChatInputImage,
} from '../../call/callImageChatAgent';
import AppCard from '../../components/ui/AppCard.vue';

useChangeHeader('Image AI', { name: 'home' });

const draftMessage = ref('');
const messages = ref<ChatHistoryItem[]>([]);
const selectedImages = ref<ImageChatInputImage[]>([]);
const generatedImages = ref<ImageChatInputImage[]>([]);
const generateImage = ref(false);
const imageCount = ref(1);
const model = ref('');
const isSending = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);

const canSend = computed(() => !isSending.value && draftMessage.value.trim().length > 0);

async function onImageInput(event: Event) {
  const target = event.target as HTMLInputElement;
  const files = Array.from(target.files ?? []).slice(0, 4);

  try {
    selectedImages.value = await Promise.all(files.map((file) => fileToInlineImage(file)));
  } catch {
    toast.error('Impossibile leggere una o piu immagini selezionate.');
  }
}

async function sendMessage() {
  const message = draftMessage.value.trim();
  if (!message || isSending.value) return;

  isSending.value = true;

  try {
    const response = await callImageChatAgent({
      message,
      history: messages.value,
      images: selectedImages.value,
      generateImage: generateImage.value,
      imageCount: generateImage.value ? imageCount.value : undefined,
    });

    const assistantText = response.text?.trim() || '(nessun testo, solo output immagine)';

    messages.value = [
      ...messages.value,
      { role: 'user', text: message },
      { role: 'assistant', text: assistantText },
    ];

    model.value = response.model;
    generatedImages.value = response.images;
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
  selectedImages.value = [];
  generatedImages.value = [];
  model.value = '';
  generateImage.value = false;
  imageCount.value = 1;

  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
}

function fileToInlineImage(file: File): Promise<ImageChatInputImage> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('File non immagine.'));
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const raw = String(reader.result ?? '');
      const parts = raw.split(',', 2);
      const dataBase64 = parts[1] ?? '';

      if (!dataBase64) {
        reject(new Error('Base64 non valido.'));
        return;
      }

      resolve({
        mimeType: file.type,
        dataBase64,
      });
    };

    reader.onerror = () => reject(new Error('Errore lettura file.'));
    reader.readAsDataURL(file);
  });
}

function inlineImageSrc(image: ImageChatInputImage) {
  return `data:${image.mimeType};base64,${image.dataBase64}`;
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
      <h1 class="h5 mb-1">Test imageChatAgent</h1>
      <div class="small text-secondary" v-if="model">Model: {{ model }}</div>
    </AppCard>

    <AppCard class="p-3 mb-3">
      <label class="form-label">Messaggio</label>
      <textarea
        v-model="draftMessage"
        class="form-control mb-3"
        rows="3"
        placeholder="Scrivi una richiesta per testo o immagini..."
      />

      <div class="mb-3">
        <label class="form-label">Immagini input (max 4)</label>
        <input ref="fileInputRef" type="file" class="form-control" multiple accept="image/*" @change="onImageInput" />
      </div>

      <div class="row g-2 mb-3 align-items-center">
        <div class="col-12 col-md-4">
          <div class="form-check">
            <input id="generate-image-toggle" v-model="generateImage" class="form-check-input" type="checkbox" />
            <label class="form-check-label" for="generate-image-toggle">Genera immagini</label>
          </div>
        </div>
        <div class="col-12 col-md-4">
          <label class="form-label small">Numero immagini generate</label>
          <select v-model.number="imageCount" class="form-select" :disabled="!generateImage">
            <option :value="1">1</option>
            <option :value="2">2</option>
            <option :value="3">3</option>
          </select>
        </div>
      </div>

      <div class="d-flex gap-2">
        <button class="btn btn-primary" :disabled="!canSend" @click="sendMessage">
          {{ isSending ? 'Invio...' : 'Invia' }}
        </button>
        <button class="btn btn-outline-secondary" @click="clearChat">Reset</button>
      </div>
    </AppCard>

    <AppCard class="p-3 mb-3">
      <h2 class="h6 mb-3">Immagini selezionate</h2>
      <div v-if="!selectedImages.length" class="text-secondary">Nessuna immagine selezionata.</div>
      <div v-else class="row g-2">
        <div class="col-6 col-md-3" v-for="(image, index) in selectedImages" :key="`input-${index}`">
          <img :src="inlineImageSrc(image)" alt="input" class="img-fluid rounded border" />
        </div>
      </div>
    </AppCard>

    <AppCard class="p-3 mb-3">
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
          <div style="white-space: pre-wrap">{{ item.text }}</div>
        </div>
      </div>
    </AppCard>

    <AppCard class="p-3">
      <h2 class="h6 mb-3">Immagini generate</h2>
      <div v-if="!generatedImages.length" class="text-secondary">Nessuna immagine generata.</div>
      <div v-else class="row g-2">
        <div class="col-6 col-md-4" v-for="(image, index) in generatedImages" :key="`generated-${index}`">
          <img :src="inlineImageSrc(image)" alt="generated" class="img-fluid rounded border" />
        </div>
      </div>
    </AppCard>
  </div>
</template>
