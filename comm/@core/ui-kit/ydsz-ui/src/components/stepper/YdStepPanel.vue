<script setup lang="ts">
/**
* 步骤面板：与 YdStepper 配对使用，类似 YdTabsContent / YdTabPane 的配对逻辑。
* 
 * 从父级 YdStepper 的 provide/inject 中获取 isActive 标志，
 * 并由父级通过 VNode patch 传入（ydsz-active prop 自动注入）。
* 
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\stepper\YdStepPanel.vue
 * @author ydsz-team
 * @since 1.0.0
 */
import type { StepperContext } from './stepper-types.ts';

import { computed, inject } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

const props = withDefaults(
  defineProps<{
    /** 自定义类名 */
    class?: any;
    /** 匹配 StepItem.key */
    name: string;
    /** 父级注入：当前是否激活（由 YdStepper 自动写入，用户无需传入） */
    'ydsz-active'?: boolean;
  }>(),
  {
    'ydsz-active': false,
  },
);

/** 从父级 YdStepper 注入上下文 */
const stepperContext = inject<StepperContext | null>('ydsz-stepper', null);

/** 当前面板是否激活：由父级 patch 的 ydsz-active 决定；未在 Stepper 内使用时默认渲染 */
const isActive = computed(() => {
  // 父级通过 prop 注入激活标志时以它为准
  if (stepperContext) {
    return props['ydsz-active'] === true;
  }
  // 独立于 YdStepper 使用时始终渲染
  return true;
});
</script>

<template>
  <div
    v-if="isActive"
    :class="cn('stepper-panel', props.class)"
    role="tabpanel"
    :data-name="name"
    :aria-hidden="!isActive"
  >
    <div class="stepper-panel__content">
      <slot></slot>
    </div>
  </div>
</template>
