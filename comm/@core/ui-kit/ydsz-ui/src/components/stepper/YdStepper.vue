<script setup lang="ts">
/**
* 多步骤向导容器：步骤条 + 内容面板 + 底部导航按钮。
* 
 * 控制逻辑：
 * 1. 下一步：调用当前 step.validate()，返回 false 则不前进（支持 sync/async）。
 * 2. 上一步：直接回退。
 * 3. 完成：最后一步显示，触发 finish 事件。
 * 4. 键盘导航：← → 切换步骤。
* 
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\stepper\YdStepper.vue
 * @author ydsz-team
 * @since 1.0.0
 */
import type { StepItem, StepperContext, StepperOrientation, StepperSize, StepperVariant } from './stepper-types';

import { type Component, type PropType, type VNode, computed, defineComponent, provide, ref, useSlots, watch } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

/**
 * 渲染代理：将 VNode 作为 render 函数输出。
 * Vue 的 <component :is> 不能直接引用 VNode 对象，
 * 需要包装为 render function 形式。
 */
const VNodeProxy = defineComponent({
  name: 'VNodeProxy',
  props: {
    vnode: { type: Object as PropType<VNode>, required: true },
  },
  setup(props) {
    return () => props.vnode;
  },
});

// ---------------------------------------------------------------------------
// Props / Emits
// ---------------------------------------------------------------------------

const props = withDefaults(
  defineProps<{
    /** 尺寸 */
    size?: StepperSize;
    /** 步骤定义列表 */
    steps: StepItem[];
    /** 初始激活步骤索引 */
    defaultStep?: number;
    /** 外观样式：'default'（标准）| 'dot' 点状 */
    variant?: StepperVariant;
    /** 方向 */
    orientation?: StepperOrientation;
    /** 完成图标 */
    finishIcon?: string | Component;
  }>(),
  {
    defaultStep: 0,
    orientation: 'horizontal',
    size: 'md',
    variant: 'default',
  },
);

const activeStep = defineModel<number>('activeStep', {
  default: 0,
});

const emit = defineEmits<{
  /** 当前步索引变化（v-model:activeStep） */
  'update:activeStep': [value: number];
  /** 点击下一步 */
  next: [payload: { from: number; to: number }];
  /** 点击上一步 */
  prev: [payload: { from: number; to: number }];
  /** 完成所有步骤 */
  finish: [];
  /** 任何步骤变化 */
  change: [payload: { index: number; step: StepItem }];
}>();

// ---------------------------------------------------------------------------
// 内部状态
// ---------------------------------------------------------------------------

/** 正在执行异步校验时锁定按钮 */
const isValidating = ref(false);

/** 当前激活步骤索引 */
const current = ref(props.defaultStep ?? 0);

/** 与 v-model 双向同步 */
watch(
  () => activeStep.value,
  (val) => {
    if (val !== undefined && val !== current.value) {
      current.value = val;
    }
  },
);

watch(current, (val) => {
  if (activeStep.value !== val) {
    activeStep.value = val;
  }
  emit('update:activeStep', val);
  emit('change', { index: val, step: props.steps[val]! });
});

/** 总步骤数 */
const totalSteps = computed(() => props.steps.length);

/** 当前步骤定义 */
const currentStep = computed(() => props.steps[current.value]);

/** 是否为第一步 */
const isFirst = computed(() => current.value === 0);

/** 是否为最后一步 */
const isLast = computed(() => current.value === totalSteps.value - 1);

// ---------------------------------------------------------------------------
// Steps 状态推导
// ---------------------------------------------------------------------------

/** 推导出每步状态 */
const resolvedSteps = computed(() =>
  props.steps.map((step, index) => {
    let status: 'wait' | 'process' | 'finish' | 'error' = 'wait';
    if (index < current.value) status = 'finish';
    else if (index === current.value) status = 'process';
    else status = 'wait';
    return { ...step, index, status };
  }),
);

// ---------------------------------------------------------------------------
// 核心操作
// ---------------------------------------------------------------------------

/** 导航到指定步骤 */
function goTo(index: number): void {
  if (index < 0 || index >= totalSteps.value) return;
  if (props.steps[index]?.disabled) return;
  current.value = index;
}

/** 上一步 */
function prev(): void {
  if (isFirst.value) return;
  const from = current.value;
  const to = from - 1;
  current.value = to;
  emit('prev', { from, to });
}

/** 下一步（含校验） */
async function next(): Promise<void> {
  if (isLast.value) return;

  const step = currentStep.value;

  if (step?.validate) {
    isValidating.value = true;
    try {
      const result = await step.validate();
      if (result === false) return;
    } finally {
      isValidating.value = false;
    }
  }

  const from = current.value;
  const to = from + 1;
  current.value = to;
  emit('next', { from, to });
}

/** 完成所有步骤 */
function finish(): void {
  const step = currentStep.value;

  if (step?.validate) {
    isValidating.value = true;
    Promise.resolve(step.validate())
      .then((result) => {
        if (result !== false) {
          emit('finish');
        }
      })
      .finally(() => {
        isValidating.value = false;
      });
    return;
  }

  emit('finish');
}

// ---------------------------------------------------------------------------
// 键盘导航
// ---------------------------------------------------------------------------

function handleKeydown(e: KeyboardEvent): void {
  if (e.key === 'ArrowRight' && !isLast.value) {
    e.preventDefault();
    next();
  } else if (e.key === 'ArrowLeft' && !isFirst.value) {
    e.preventDefault();
    prev();
  }
}

// ---------------------------------------------------------------------------
// Provide 注入（子面板读取状态）
// ---------------------------------------------------------------------------

provide<StepperContext>('ydsz-stepper', {
  activeStep: current.value,
  totalSteps: totalSteps.value,
});

// ---------------------------------------------------------------------------
// Slot 面板匹配
// ---------------------------------------------------------------------------

const slots = useSlots();

/**
 * 获取当前激活面板的 VNode 列表。
 * 同时通过 patch 将 ydsz-active 注入到每个子面板，
 * 使 YdStepPanel 可以判断自身是否激活。
 */
const visibleChildren = computed<VNode[]>(() => {
  if (!slots.default) return [];

  const vnodes = slots.default();
  const currentKey = currentStep.value?.key;

  if (!currentKey) return [];

  return vnodes.map((vnode) => {
    const vnodeProps = vnode.props as Record<string, any> | null;
    const isMatch = vnodeProps?.name === currentKey;
    // 动态注入 ydsz-active 标志（不修改原始 props，创建新对象）
    return {
      ...vnode,
      props: {
        ...vnodeProps,
        'ydsz-active': isMatch,
      },
    } as VNode;
  });
});

// ---------------------------------------------------------------------------
// 尺寸映射
// ---------------------------------------------------------------------------

const stepTextClass = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'text-xs';
    case 'lg':
      return 'text-base';
    default:
      return 'text-sm';
  }
});

/** header 根据 orientation 调整布局 */
const headerDirection = computed(() =>
  props.orientation === 'vertical' ? 'flex-col' : 'flex-row',
);
</script>

<template>
  <div
    :class="cn('stepper flex flex-col overflow-hidden rounded-lg border bg-card', stepTextClass)"
    role="navigation"
    aria-label="步骤向导"
    tabindex="0"
    @keydown="handleKeydown"
  >
    <!-- ========== 步骤条头部 ========== -->
    <div :class="cn('stepper-header flex items-center justify-between border-b px-6 py-4', headerDirection)">
      <!-- 步骤节点列表 -->
      <ol class="flex w-full items-start" :class="orientation === 'vertical' ? 'flex-col gap-4' : 'flex-row'">
        <li
          v-for="step in resolvedSteps"
          :key="step.index"
          :class="[
            'flex items-center gap-2',
            orientation === 'horizontal' ? 'flex-1 last:flex-none last:shrink-0' : 'w-full',
            step.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
          ]"
          @click="!step.disabled && goTo(step.index)"
        >
          <!-- 序号/图标 -->
          <span
            :class="
              cn(
                'flex shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors',
                variant === 'dot' ? 'size-2.5' : 'size-8',
                step.status === 'process'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : step.status === 'finish'
                    ? 'bg-green-500 text-white border-green-500'
                    : 'bg-neutral-200 text-neutral-500 border-neutral-300 dark:bg-neutral-700 dark:text-neutral-400',
              )
            "
          >
            <template v-if="variant !== 'dot'">
              <svg
                v-if="step.status === 'finish'"
                class="size-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <template v-else>{{ step.index + 1 }}</template>
            </template>
          </span>

          <!-- 标题 + 描述 -->
          <div class="flex flex-col">
            <span
              :class="
                cn(
                  'font-medium transition-colors',
                  step.status === 'process'
                    ? 'text-foreground'
                    : step.status === 'finish'
                      ? 'text-foreground/80'
                      : 'text-muted-foreground',
                )
              "
            >
              {{ step.title }}
            </span>
            <span
              v-if="step.description"
              class="mt-0.5 text-xs text-muted-foreground"
            >
              {{ step.description }}
            </span>
          </div>

          <!-- 连接线（仅水平方向） -->
          <span
            v-if="orientation === 'horizontal' && step.index < resolvedSteps.length - 1"
            :class="
              cn(
                'mx-2 h-px flex-1 min-w-4',
                step.status === 'finish'
                  ? 'bg-green-500'
                  : step.status === 'process'
                    ? 'bg-gradient-to-r from-green-500 to-neutral-200'
                    : 'bg-neutral-200 dark:bg-neutral-700',
              )
            "
            aria-hidden="true"
          ></span>
        </li>
      </ol>
    </div>

    <!-- ========== 内容区域 ========== -->
    <div class="stepper-body flex-1 overflow-auto p-6">
      <!-- 遍历子面板 VNode，通过渲染代理组件输出 -->
      <template v-for="(vnode, idx) in visibleChildren" :key="idx">
        <VNodeProxy :vnode="vnode" />
      </template>
      <!-- 兜底：未匹配到 Panel 时渲染默认 slot 内容 -->
      <slot v-if="visibleChildren.length === 0"></slot>
    </div>

    <!-- ========== 底部按钮组 ========== -->
    <div class="stepper-footer flex items-center justify-between border-t px-6 py-3">
      <div>
        <slot name="footer-left"></slot>
      </div>

      <div class="flex items-center gap-2">
        <!-- 上一步 -->
        <button
          :class="
            cn(
              'inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50',
              isFirst ? 'invisible' : '',
            )
          "
          :disabled="isFirst || isValidating"
          type="button"
          @click="prev"
        >
          上一步
        </button>

        <!-- 下一步 -->
        <button
          v-if="!isLast"
          :class="
            cn(
              'inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50',
            )
          "
          :disabled="isValidating"
          type="button"
          @click="next"
        >
          <svg
            v-if="isValidating"
            class="mr-2 size-4 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            ></path>
          </svg>
          下一步
        </button>

        <!-- 完成 -->
        <button
          v-if="isLast"
          :class="
            cn(
              'inline-flex items-center justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:pointer-events-none disabled:opacity-50',
            )
          "
          :disabled="isValidating"
          type="button"
          @click="finish"
        >
          <svg
            v-if="isValidating"
            class="mr-2 size-4 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            ></path>
          </svg>
          完成
        </button>
      </div>
    </div>
  </div>
</template>
