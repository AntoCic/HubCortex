<!-- DemoFormValidator.vue -->
<script setup lang="ts">
import { FormValidator } from '../FormValidator'
import { required, maxLength, email } from '../Validator'
import { toast } from '../../toast/toastController'
import BtnCmp from '../../Btn/BtnCmp.vue'
import type { ColorTag } from '../../input/Tag/ColorTag'
import ColorTagInput from '../../input/Tag/ColorTagInput.vue'
import TiptapField from '../../input/Tiptap/TiptapField.vue'


const suggestions: ColorTag[] = [
  { label: 'famiglia', color: '#6610f2' },
  { label: 'amici', color: '#198754' },
  { label: 'lavoro', color: '#00bcd4' },
]

interface DemoFormModel {
  name: string
  email: string
  role: string
  tag: ColorTag[]
  bio: string
  newsletter: boolean
}

const fv = new FormValidator<DemoFormModel>({
  id: 'demo-form-validator',
  initialValues: {
    name: '',
    email: '',
    role: '',
    tag: [],
    bio: '',
    newsletter: false,
  },
  validator: {
    name: [required(), maxLength(50)],
    email: [required(), email()],
    role: [required()],
    bio: [maxLength(200)],
  },
  onSubmit: async (values) => {
    console.log('SUBMIT', values)
    toast.success('Form inviato correttamente')
  },
  onInvalid: () => {
    toast.error('Controlla i campi evidenziati')
  },
})

const { name, email: _email, role, tag, bio, newsletter } = fv.fields()
</script>

<template>
  <div class="container py-4">
    <h1 class="h4 mb-4">Demo FormValidator</h1>

    <form @submit.prevent="fv.submit" novalidate>
      <div class="row g-3">

        <!-- Nome -->
        <div class="col-md-6">
          <label class="form-label" :for="fv.getFieldId('name')">
            Nome *
          </label>
          <input type="text" class="form-control" v-model="name" v-bind="fv.getFieldProps('name')"
            placeholder="Mario" />
          <div :id="fv.getFieldIdError('name')" class="invalid-feedback">
            {{ fv.showError('name') }}
          </div>
        </div>

        <!-- Email -->
        <div class="col-md-6">
          <label class="form-label" :for="fv.getFieldId('email')">
            Email *
          </label>
          <input type="email" class="form-control" v-model="_email" v-bind="fv.getFieldProps('email')"
            placeholder="mario.rossi@email.com" />
          <div :id="fv.getFieldIdError('email')" class="invalid-feedback">
            {{ fv.showError('email') }}
          </div>
        </div>

        <!-- Ruolo -->
        <div class="col-md-6">
          <label class="form-label" :for="fv.getFieldId('role')">
            Ruolo *
          </label>
          <select class="form-select" v-model="role" v-bind="fv.getFieldProps('role')">
            <option value="" disabled>Seleziona…</option>
            <option value="admin">Admin</option>
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
          <div :id="fv.getFieldIdError('role')" class="invalid-feedback">
            {{ fv.showError('role') }}
          </div>
        </div>

        <!-- Bio -->
        <div class="col-12">
          <label class="form-label" :for="fv.getFieldId('tag')">
            tag
          </label>

          <ColorTagInput v-model="tag" v-bind="fv.getFieldProps('tag')" :suggestions="suggestions"
            placeholder="aggiungi qualche tag" @change="(type, tag) => {
              if (type !== 'edit') return

              const index = suggestions.findIndex(t => t.label === tag.label)
              if (index !== -1) {
                suggestions[index] = { ...suggestions[index], ...tag }
              }
            }" @newSuggestion="(tag) => {
              if (!suggestions.some(t => t.label === tag.label)) {
                suggestions.push(tag)
              }
            }" @deleteSuggestion="(tag) => {
              const index = suggestions.findIndex(t => t.label === tag.label)
              if (index !== -1) {
                suggestions.splice(index, 1)
              }
            }" />
          <div :id="fv.getFieldIdError('tag')" class="invalid-feedback">
            {{ fv.showError('tag') }}
          </div>
        </div>

        <!-- Bio -->
        <div class="col-12">
          <label class="form-label" :for="fv.getFieldId('bio')">
            Bio
          </label>

          <TiptapField v-model="bio" v-bind="fv.getFieldProps('bio')" placeholder="Scrivi qualcosa su di te…"
            class="text-dark" />
          <div :id="fv.getFieldIdError('bio')" class="invalid-feedback">{{ fv.showError('bio') }}</div>
        </div>

        <!-- Newsletter -->
        <div class="col-12">
          <div class="form-check">
            <input class="form-check-input" type="checkbox" v-model="newsletter" v-bind="fv.getFieldProps('newsletter')"
              :id="fv.getFieldId('newsletter')" />
            <label class="form-check-label" :for="fv.getFieldId('newsletter')">
              Iscrivimi alla newsletter
            </label>
          </div>
          <div :id="fv.getFieldIdError('newsletter')" class="invalid-feedback">
            {{ fv.showError('newsletter') }}
          </div>
        </div>

      </div>

      <!-- Actions -->
      <div class="d-flex justify-content-between align-items-center mt-4">
        <BtnCmp icon="replay" class="btn btn-outline-secondary" @click="fv.reset()">
          Reset
        </BtnCmp>

        <BtnCmp icon="save" class="btn btn-primary" type="submit">
          Invia
        </BtnCmp>
      </div>

      <!-- Debug -->
      <details class="mt-4 small">
        <summary class="text-muted">Debug values</summary>
        <pre class="mt-2 mb-0">{{ fv.values }}</pre>
      </details>
    </form>
  </div>
</template>
