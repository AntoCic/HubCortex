<script setup lang="ts">
import { computed } from 'vue'
import type { FormValidator } from '../../form-validator/FormValidator'
import type { PhoneNumber } from './PhoneNumber';

// * <FieldPhoneNumber label="Telefono" v-model="phoneNumber" field="phoneNumber" :fv="fv" disabled />

const props = withDefaults(defineProps<{
  modelValue: PhoneNumber
  field: string
  fv: FormValidator<any>

  label?: string | boolean
  placeholder?: string
  placeholderPrefix?: string
  errors?: boolean

  // globali (valgono per entrambi)
  disabled?: boolean
  readonly?: boolean
  class?: any
  style?: any

  // override per singolo input
  disabledPrefix?: boolean
  disabledNumber?: boolean

  readonlyPrefix?: boolean
  readonlyNumber?: boolean

  classPrefix?: any
  classNumber?: any

  stylePrefix?: any
  styleNumber?: any
}>(), {
  label: false,
  placeholder: '333 1234567',
  placeholderPrefix: '+39',
  errors: true,
  disabled: false,
  readonly: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', v: PhoneNumber): void
}>()

const prefix = computed<string>({
  get() {
    return props.modelValue?.[0] ?? props.placeholderPrefix ?? ''
  },
  set(v) {
    emit('update:modelValue', [v, props.modelValue?.[1] ?? ''])
  },
})

const number = computed<string>({
  get() {
    return props.modelValue?.[1] ?? ''
  },
  set(v) {
    emit('update:modelValue', [props.modelValue?.[0] ?? (props.placeholderPrefix ?? ''), v])
  },
})

const disabledPrefixEff = computed(() => props.disabledPrefix ?? props.disabled)
const disabledNumberEff = computed(() => props.disabledNumber ?? props.disabled)
const readonlyPrefixEff = computed(() => props.readonlyPrefix ?? props.readonly)
const readonlyNumberEff = computed(() => props.readonlyNumber ?? props.readonly)

const classPrefixEff = computed(() => [props.class, props.classPrefix])
const classNumberEff = computed(() => [props.class, props.classNumber])

const stylePrefixEff = computed(() => [props.style, props.stylePrefix])
const styleNumberEff = computed(() => [props.style, props.styleNumber])
</script>

<template>
  <label v-if="label" class="form-label" :for="fv.getFieldId(field)">
    {{ label === true ? field : label }}
  </label>

  <div class="d-flex gap-2">
    <!-- PREFIX -->
    <input type="text" v-model="prefix" class="form-control prefix-width" :class="classPrefixEff"
      :style="stylePrefixEff" :placeholder="placeholderPrefix" :disabled="disabledPrefixEff"
      :readonly="readonlyPrefixEff" autocomplete="tel-country-code" inputmode="tel" />

    <!-- NUMBER -->
    <input type="text" v-model="number" v-bind="fv.getFieldProps(field)" class="form-control" :class="classNumberEff"
      :style="styleNumberEff" :placeholder="placeholder" :disabled="disabledNumberEff" :readonly="readonlyNumberEff"
      autocomplete="tel" inputmode="tel" />
  </div>

  <div v-if="errors" :id="fv.getFieldIdError(field)" class="invalid-feedback">
    {{ fv.showError(field) }}
  </div>
</template>

<style lang="scss" scoped>
.prefix-width {
  width: 60px;
}
</style>
