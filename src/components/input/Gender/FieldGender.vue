<script setup lang="ts">
import { computed, type Component } from 'vue'
import type { FormValidator } from '../../form-validator/FormValidator'

export type Gender = '' | 'm' | 'f' | 'o'

// * <FieldGender label="Sesso" v-model="gender" field="gender" :fv="fv" />
// * <FieldGender :label="MyLabelCmp" v-model="gender" field="gender" :fv="fv" required />

const props = withDefaults(defineProps<{
  modelValue: Gender
  field: string
  fv: FormValidator<any>

  label?: string | boolean | Component
  placeholder?: string
  errors?: boolean

  disabled?: boolean
  readonly?: boolean
  required?: boolean

  class?: any
  style?: any
  classLabel?: any
}>(), {
  label: false,
  placeholder: '—',
  errors: true,
  disabled: false,
  readonly: false,
  required: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', v: Gender): void
}>()

const gender = computed<Gender>({
  get() {
    return props.modelValue ?? ''
  },
  set(v) {
    emit('update:modelValue', (v ?? '') as Gender)
  },
})

const isLabelComponent = computed(
  () => typeof props.label !== 'string' && props.label !== true && props.label !== false,
)
</script>

<template>
  <!-- LABEL -->
  <label v-if="label && !isLabelComponent" class="form-label" :class="props.classLabel" :for="fv.getFieldId(field)">
    {{ label === true ? field : label }}
    <span v-if="required" class="text-danger"> *</span>
  </label>

  <component v-else-if="label && isLabelComponent" :is="label" :for="fv.getFieldId(field)" />

  <!-- SELECT -->
  <select class="form-select" v-model="gender" v-bind="fv.getFieldProps(field)" :class="props.class"
    :style="props.style" :disabled="disabled" :readonly="readonly">
    <option value="">{{ placeholder }}</option>
    <option value="m">Maschio</option>
    <option value="f">Femmina</option>
    <option value="o">Altro / Preferisco non dirlo</option>
  </select>

  <!-- ERROR -->
  <div v-if="errors" :id="fv.getFieldIdError(field)" class="invalid-feedback">
    {{ fv.showError(field) }}
  </div>
</template>

<style scoped lang="scss"></style>
