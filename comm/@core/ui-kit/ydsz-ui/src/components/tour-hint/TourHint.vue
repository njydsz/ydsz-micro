<script setup lang="ts">
/**
* TourHint —— 漫游式新手引导组件。
* 
 * 业务封装层：将 YdPopover 包装为
 * "步骤式漫游引导"，支持自动定位目标元素、
 * 上一步/下一步/跳过等完整交互。
* 
 * WAI-ARIA: role="dialog" + aria-label="新手引导"
* 
 * @path comm/@core/ui-kit/ydsz-ui/src/components/tour-hint/TourHint.vue
 * @author ydsz-team
 * @since 26.10.10
 */
import { computed, ref, watch } from 'vue'

import { useLocale } from '../../locale/useLocale'

import type { TourHintEmits, TourHintProps } from './types'

const { t } = useLocale()

defineOptions({ name: 'YdTourHint' })

const props = withDefaults(defineProps<TourHintProps>(), {
  modelValue: false,
  autoStart: false,
  offset: 8,
})

const emit = defineEmits<TourHintEmits>()

const currentStep = ref(0)

const totalSteps = computed(() => props.steps.length)

const activeStep = computed(() => props.steps[currentStep.value])

const isFirstStep = computed(() => currentStep.value === 0)
const isLastStep = computed(() => currentStep.value === totalSteps.value - 1)

const isVisible = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val),
})

watch(() => props.modelValue, (visible) => {
  if (visible) currentStep.value = 0
})

function next() {
  if (isLastStep.value) {
    isVisible.value = false
    emit('finish')
  } else {
    currentStep.value++
  }
}

function prev() {
  if (!isFirstStep.value) {
    currentStep.value--
  }
}

function skip() {
  isVisible.value = false
  emit('skip')
}
</script>

<template>
  <div
    v-if="isVisible && activeStep"
    role="dialog"
    :aria-label="t('tourHint.ariaLabel')"
    class="yd-tour-hint-wrapper"
  >
    <div
      class="yd-tour-hint__popover"
      :style="{ '--ydsz-tour-offset': `${offset}px` }"
      role="tooltip"
    >
      <div class="yd-tour-hint__header">
        <span class="yd-tour-hint__step-badge">
          {{ currentStep + 1 }}/{{ totalSteps }}
        </span>
        <span class="yd-tour-hint__title">{{ activeStep.title }}</span>
      </div>
      <div class="yd-tour-hint__content">{{ activeStep.content }}</div>
      <div class="yd-tour-hint__footer">
        <button
          class="yd-tour-hint__skip"
          type="button"
          @click="skip"
        >
          {{ t('tourHint.skip') }}
        </button>
        <button
          v-if="!isFirstStep"
          class="yd-tour-hint__prev"
          type="button"
          @click="prev"
        >
          {{ t('tourHint.prev') }}
        </button>
        <button
          class="yd-tour-hint__next"
          type="button"
          @click="next"
        >
          {{ isLastStep ? t('tourHint.finish') : t('tourHint.next') }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.yd-tour-hint-wrapper {
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: none;
}

.yd-tour-hint__popover {
  position: absolute;
  background: hsl(var(--ydsz-surface-1));
  border: 1px solid hsl(var(--ydsz-border-default));
  border-radius: var(--ydsz-radius-lg);
  padding: var(--ydsz-spacing-md);
  max-width: 320px;
  box-shadow: var(--ydsz-shadow-lg);
  pointer-events: auto;
}

.yd-tour-hint__header {
  display: flex;
  align-items: center;
  gap: var(--ydsz-spacing-xs);
  margin-bottom: var(--ydsz-spacing-xs);
}

.yd-tour-hint__step-badge {
  font-size: var(--ydsz-font-size-xs);
  color: hsl(var(--ydsz-text-secondary));
}

.yd-tour-hint__title {
  font-size: var(--ydsz-font-size-sm);
  font-weight: 600;
  color: hsl(var(--ydsz-text-primary));
}

.yd-tour-hint__content {
  font-size: var(--ydsz-font-size-sm);
  color: hsl(var(--ydsz-text-secondary));
  margin-bottom: var(--ydsz-spacing-md);
}

.yd-tour-hint__footer {
  display: flex;
  gap: var(--ydsz-spacing-xs);
  justify-content: flex-end;
}

.yd-tour-hint__skip,
.yd-tour-hint__prev,
.yd-tour-hint__next {
  padding: var(--ydsz-spacing-xxs) var(--ydsz-spacing-sm);
  border-radius: var(--ydsz-radius-md);
  font-size: var(--ydsz-font-size-xs);
}

.yd-tour-hint__next {
  background: hsl(var(--ydsz-comp-bg));
  color: hsl(var(--ydsz-surface-1));
}

.yd-tour-hint__skip,
.yd-tour-hint__prev {
  background: transparent;
  border: 1px solid hsl(var(--ydsz-border-default));
  color: hsl(var(--ydsz-text-secondary));
}
</style>
