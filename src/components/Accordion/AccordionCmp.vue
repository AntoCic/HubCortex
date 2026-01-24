<!-- AccordionCmp.vue -->
<script setup lang="ts">
import { computed, useSlots, useAttrs } from "vue";

defineOptions({ inheritAttrs: false });

const props = defineProps<{
    id?: string;
    title?: string;
    defaultOpen?: boolean;
    disabled?: boolean;
}>();

const emit = defineEmits<{
    (e: "open", ev: MouseEvent): void;
}>();

const slots = useSlots();
const attrs = useAttrs();

const id = computed(() => props.id ?? 'accordionDefault');
const isDisabled = computed(() => !!props.disabled);

// Verifica se lo slot default ha contenuto
const hasDefaultSlot = computed(() => !!slots.default?.().length);
const hasHeaderSlot = computed(() => !!slots.header?.().length);

function onClick(ev: MouseEvent) {
    if (isDisabled.value) {
        ev.preventDefault();
        ev.stopPropagation();
        return;
    }
    emit("open", ev);
}

</script>

<template>
    <div class="accordion" :id="id" v-bind="attrs">
        <div class="accordion-item">
            <h2 class="accordion-header">
                <button class="accordion-button collapsed p-2" type="button" data-bs-toggle="collapse"
                    :data-bs-target="`#collapseOne-${id}`" aria-expanded="false" :aria-controls="`collapseOne-${id}`"
                    :disabled="isDisabled" @click="onClick">
                    <template v-if="hasHeaderSlot">
                        <slot name="header"></slot>
                    </template>
                    <template v-else>
                        {{ props.title ?? "- default -" }}
                    </template>
                </button>
            </h2>
            <div :id="`collapseOne-${id}`" class="accordion-collapse collapse" :data-bs-parent="`#${id}`">
                <div class="accordion-body">
                    <p v-if="!hasDefaultSlot">
                        -
                        <span class="material-symbols-outlined text-warning">
                            warning
                        </span>
                        -
                    </p>
                    <slot></slot>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss"></style>
