<!--
 * Tour 引导：分步骤引导用户认识页面功能。
 *
 * 受控组件：通过 v-model:open 控制显隐，current 控制当前步骤。
 * 提供 mask（遮罩）+ highlight（高亮区域）+ popover（步骤卡片）三件套。
 *
 * 每个步骤的 target 通过 CSS 选择器指定（预留，运行时由 TourProvider 注入），
 * 点击下一步 / 跳过 / 完成按钮后触发对应回调。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\tour\YdTour.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup">
import { computed } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

import { YdButton } from '../button';

interface TourStep {
  description?: string;
  target?: string;
  title: string;
}

interface Props {
  /** 自定义类名 */
  class?: any;
  /** 当前步骤索引 */
  current: number;
  /** 是否显示遮罩 */
  mask?: boolean;
  /** 是否打开 */
  open: boolean;
  /** 引导步骤配置 */
  steps: TourStep[];
}

const props = withDefaults(defineProps<Props>(), {
  mask: true,
});

const emit = defineEmits<{
  close: [];
  'update:open': [value: boolean];
  finish: [];
  change: [index: number];
}>();

const totalSteps = computed(() => props.steps.length);
const isActive = computed(() => props.current < totalSteps.value);
const currentStep = computed(() => props.steps[props.current]);

function next(): void {
  if (props.current >= totalSteps.value - 1) {
    emit('finish');
    emit('update:open', false);
  } else {
    emit('change', props.current + 1);
  }
}

function prev(): void {
  if (props.current > 0) {
    emit('change', props.current - 1);
  }
}

function cancel(): void {
  emit('close');
  emit('update:open', false);
}
</script>

<template>
  <template v-if="props.open">
    <div
      v-if="props.mask"
      class="fixed inset-0 z-[var(--z-backdrop)] bg-black/40 transition-opacity"
      aria-hidden="true"
    ></div>

    <!-- 引导高亮框 -->
    <div
      v-if="currentStep"
      :class="
        cn(
          'ring-tour-highlight-ring fixed z-[var(--z-overlay)] rounded-md ring-2 ring-offset-2 transition-all duration-300',
          props.class,
        )
      "
      :style="{
        top: 'calc(50% - 40px)',
        left: 'calc(50% - 160px)',
        width: '320px',
        height: '80px',
      }"
    ></div>

    <!-- 步骤卡片 -->
    <div
      v-if="currentStep"
      class="bg-background fixed right-8 top-8 z-[var(--z-popover)] w-80 rounded-lg border p-4 shadow-xl"
      role="dialog"
      aria-modal="true"
      :aria-label="`引导步骤 ${props.current + 1}/${totalSteps}`"
    >
      <h3 class="text-foreground mb-1 text-sm font-semibold">{{ currentStep.title }}</h3>
      <p class="text-muted-foreground mb-4 text-sm">{{ currentStep.description }}</p>

      <!-- 步骤指示点 -->
      <div class="mb-4 flex gap-1">
        <span
          v-for="(_, i) in totalSteps"
          :key="i"
          :class="cn('size-1.5 rounded-full', i === props.current ? 'bg-primary' : 'bg-muted')"
        ></span>
      </div>

      <!-- 操作按钮 -->
      <div class="flex items-center justify-between">
        <span class="text-muted-foreground text-xs">{{ props.current + 1 }} / {{ totalSteps }}</span>
        <div class="flex gap-2">
          <YdButton v-if="props.current > 0" size="sm" variant="ghost" @click="prev">上一步</YdButton>
          <YdButton size="sm" @click="next">
            {{ props.current >= totalSteps - 1 ? '完成' : '下一步' }}
          </YdButton>
          <YdButton size="sm" variant="outline" @click="cancel">跳过</YdButton>
        </div>
      </div>
    </div>
  </template>
</template>
