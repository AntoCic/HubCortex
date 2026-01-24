<script setup lang="ts">
import { computed, type Component } from 'vue'
import type { FormValidator } from '../../form-validator/FormValidator'

export type HTMLAttributesInputmode = "email" | "text" | "search" | "tel" | "url" | "none" | "numeric" | "decimal" | undefined
// * <FieldText label="Nome *" v-model="name" field="name" :fv="fv" placeholder="Mario" />
// * <FieldText :label="MyLabelCmp" v-model="name" field="name" :fv="fv" />

const props = withDefaults(defineProps<{
    modelValue: string | number
    field: string
    fv: FormValidator<any>

    // ✅ può essere anche un componente
    label?: string | boolean | Component
    placeholder?: string
    errors?: boolean

    disabled?: boolean
    readonly?: boolean
    required?: boolean
    class?: any
    style?: any

    classLabel?: any

    type?: string
    autocomplete?: string
    inputmode?: HTMLAttributesInputmode
}>(), {
    label: false,
    placeholder: '',
    errors: true,
    disabled: false,
    readonly: false,
    required: false,
    type: 'text',
})

const emit = defineEmits<{
    (e: 'update:modelValue', v: string | number): void
}>()

const value = computed<string | number>({
    get() {
        return props.modelValue ?? ''
    },
    set(v) {
        emit('update:modelValue', v ?? '')
    },
})

const isLabelComponent = computed(() => typeof props.label !== 'string' && props.label !== true && props.label !== false)
</script>

<template>
    <!-- LABEL -->
    <label v-if="label && !isLabelComponent" class="form-label" :class="props.classLabel" :for="fv.getFieldId(field)">
        {{ label === true ? field : label }} <span v-if="required" class="text-danger"> *</span>
    </label>

    <component v-else-if="label && isLabelComponent" :is="label" :for="fv.getFieldId(field)" />

    <!-- INPUT -->
    <input :type="type" v-model="value" v-bind="fv.getFieldProps(field)" class="form-control" :class="props.class"
        :style="props.style" :placeholder="placeholder" :disabled="disabled" :readonly="readonly"
        :autocomplete="autocomplete" :inputmode="inputmode" />

    <!-- ERROR -->
    <div v-if="errors" :id="fv.getFieldIdError(field)" class="invalid-feedback">
        {{ fv.showError(field) }}
    </div>
</template>

<style scoped lang="scss"></style>
