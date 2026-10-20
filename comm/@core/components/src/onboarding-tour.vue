<!--
 * OnboardingTour 用户引导组件 — 自研轻量实现（零依赖 driver.js）
 *
 * <p>功能：
 * <ul>
 *   <li>深色半透明遮罩 + 高亮聚焦区域 + popover 卡片</li>
 *   <li>自动检测首次访问（localStorage flag <code>ydsz_onboarding_done</code>）</li>
 *   <li>支持跳过 / 下一步 / 完成</li>
 *   <li>键盘导航（Esc 关闭 / → 下一步 / ← 上一步）</li>
 * </ul>
 *
 * <p>接口：
 * <pre>
 * interface TourStep {
 *   target: string | (() => HTMLElement | null);  // CSS 选择器或 ref 函数
 *   title?: string;         // 步骤标题
 *   description?: string;   // 步骤描述
 *   position?: 'top' | 'bottom' | 'left' | 'right';  // popover 方位，默认 'bottom'
 * }
 * </pre>
 *
 * @path comm\@core\components\src\onboarding-tour.vue
 * @author ydsz-team
 * @since 27.01.04
-->
<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

/** popover 方位 */
export type TourPopoverPosition = 'top' | 'bottom' | 'left' | 'right';

/** 单步引导配置 */
export interface TourStep {
  /** 目标元素选择器或 DOM 查询函数 */
  target: string | (() => HTMLElement | null);
  /** 步骤标题 */
  title?: string;
  /** 步骤描述 */
  description?: string;
  /** popover 相对目标的方位，默认 'bottom' */
  position?: TourPopoverPosition;
}

/** localStorage 完成标记 key */
const ONBOARDING_DONE_KEY = 'ydsz_onboarding_done';

interface Props {
  /** 引导步骤列表 */
  steps: TourStep[];
  /** 是否自动播放（首次访问自动启动） */
  autoPlay?: boolean;
  /** 遮罩透明度，默认 0.75 */
  overlayOpacity?: number;
  /** 高亮区域圆角，默认 8px */
  highlightRadius?: number;
  /** 高亮区域与目标的间距（px），默认 8 */
  highlightOffset?: number;
}

const props = withDefaults(defineProps<Props>(), {
  autoPlay: true,
  overlayOpacity: 0.75,
  highlightRadius: 8,
  highlightOffset: 8,
});

const emit = defineEmits<{
  finish: [];
  skip: [];
  change: [index: number, step: TourStep];
}>();

/** 当前步骤索引 */
const currentStepIndex = ref(0);

/** 是否可见 */
const visible = ref(false);

/** 高亮区域位置 */
const highlightStyle = ref<Record<string, string>>({});

/** Popover 位置 */
const popoverStyle = ref<Record<string, string>>({});

/** Popover 实际渲染方位 */
const actualPosition = ref<TourPopoverPosition>('bottom');

/** 当前步 */
const currentStep = computed<TourStep | undefined>(() => props.steps[currentStepIndex.value]);

/** 是否为最后一步 */
const isLastStep = computed(() => currentStepIndex.value >= props.steps.length - 1);

/** 是否为第一步 */
const isFirstStep = computed(() => currentStepIndex.value <= 0);

/**
 * 查找目标元素。
 */
function resolveTarget(target: string | (() => HTMLElement | null)): HTMLElement | null {
  if (typeof target === 'function') {
    return target();
  }
  return document.querySelector(target);
}

/**
 * 计算高亮区域和 popover 位置。
 */
async function updatePosition(): Promise<void> {
  if (!currentStep.value) return;

  const targetEl = resolveTarget(currentStep.value.target);
  if (!targetEl) {
    // 目标元素不存在时隐藏遮罩
    highlightStyle.value = { display: 'none' };
    popoverStyle.value = { display: 'none' };
    return;
  }

  await nextTick();

  const rect = targetEl.getBoundingClientRect();
  const offset = props.highlightOffset ?? 8;
  const radius = props.highlightRadius ?? 8;

  // 高亮区域：目标元素位置 + offset 间距
  highlightStyle.value = {
    display: 'block',
    top: `${rect.top - offset}px`,
    left: `${rect.left - offset}px`,
    width: `${rect.width + offset * 2}px`,
    height: `${rect.height + offset * 2}px`,
    borderRadius: `${radius}px`,
  };

  // 计算 popover 位置
  const placement = currentStep.value.position ?? 'bottom';
  await positionPopover(rect, placement);
}

/**
 * 根据目标位置计算 popover 坐标。
 */
async function positionPopover(
  targetRect: DOMRect,
  placement: TourPopoverPosition,
): Promise<void> {
  const gap = 12;

  // 估算 popover 尺寸（实际渲染后会更精确）
  const estimatedWidth = 300;
  const estimatedHeight = 150;

  let top = 0;
  let left = 0;
  actualPosition.value = placement;

  switch (placement) {
    case 'top':
      top = targetRect.top - estimatedHeight - gap;
      left = targetRect.left + targetRect.width / 2 - estimatedWidth / 2;
      // 越界回退
      if (top < 0) actualPosition.value = 'bottom';
      break;
    case 'bottom':
      top = targetRect.bottom + gap;
      left = targetRect.left + targetRect.width / 2 - estimatedWidth / 2;
      // 越界回退
      if (top + estimatedHeight > globalThis.innerHeight) actualPosition.value = 'top';
      break;
    case 'left':
      left = targetRect.left - estimatedWidth - gap;
      top = targetRect.top + targetRect.height / 2 - estimatedHeight / 2;
      // 越界回退
      if (left < 0) actualPosition.value = 'right';
      break;
    case 'right':
      left = targetRect.right + gap;
      top = targetRect.top + targetRect.height / 2 - estimatedHeight / 2;
      // 越界回退
      if (left + estimatedWidth > globalThis.innerWidth) actualPosition.value = 'left';
      break;
  }

  // 根据最终方位重新计算
  switch (actualPosition.value) {
    case 'top':
      top = targetRect.top - estimatedHeight - gap;
      left = targetRect.left + targetRect.width / 2 - estimatedWidth / 2;
      break;
    case 'bottom':
      top = targetRect.bottom + gap;
      left = targetRect.left + targetRect.width / 2 - estimatedWidth / 2;
      break;
    case 'left':
      left = targetRect.left - estimatedWidth - gap;
      top = targetRect.top + targetRect.height / 2 - estimatedHeight / 2;
      break;
    case 'right':
      left = targetRect.right + gap;
      top = targetRect.top + targetRect.height / 2 - estimatedHeight / 2;
      break;
  }

  // 边界保护
  left = Math.max(16, Math.min(left, globalThis.innerWidth - estimatedWidth - 16));
  top = Math.max(16, Math.min(top, globalThis.innerHeight - estimatedHeight - 16));

  popoverStyle.value = {
    display: 'block',
    top: `${top}px`,
    left: `${left}px`,
    maxWidth: '320px',
  };
}

/** 上一步 */
function prev(): void {
  if (isFirstStep.value) return;
  currentStepIndex.value--;
  emit('change', currentStepIndex.value, props.steps[currentStepIndex.value]);
  void updatePosition();
}

/** 下一步 */
function next(): void {
  if (isLastStep.value) {
    finish();
    return;
  }
  currentStepIndex.value++;
  emit('change', currentStepIndex.value, props.steps[currentStepIndex.value]);
  void updatePosition();
}

/** 完成 */
function finish(): void {
  visible.value = false;
  try {
    localStorage.setItem(ONBOARDING_DONE_KEY, 'true');
  } catch {
    // localStorage 不可用时静默忽略
  }
  emit('finish');
}

/** 跳过 */
function skip(): void {
  visible.value = false;
  try {
    localStorage.setItem(ONBOARDING_DONE_KEY, 'true');
  } catch {
    // localStorage 不可用时静默忽略
  }
  emit('skip');
}

/** 启动引导 */
function start(): void {
  if (props.steps.length === 0) return;
  currentStepIndex.value = 0;
  visible.value = true;
  emit('change', 0, props.steps[0]);
  void updatePosition();
}

/** 关闭引导 */
function close(): void {
  visible.value = false;
  emit('skip');
}

/**
 * 键盘事件处理。
 */
function handleKeydown(event: KeyboardEvent): void {
  if (!visible.value) return;
  switch (event.key) {
    case 'Escape':
      skip();
      break;
    case 'ArrowRight':
    case 'Enter':
      next();
      break;
    case 'ArrowLeft':
      prev();
      break;
  }
}

// 监听步骤变化 → 更新位置
watch(currentStepIndex, () => {
  void updatePosition();
});

// 监听 visible 变化 → 显示后更新位置
watch(
  visible,
  (v) => {
    if (v) {
      void nextTick(() => updatePosition());
    }
  },
);

onMounted(() => {
  document.addEventListener('keydown', handleKeydown);

  // 自动检测首次访问
  if (props.autoPlay) {
    let done = false;
    try {
      done = localStorage.getItem(ONBOARDING_DONE_KEY) === 'true';
    } catch {
      done = false;
    }
    if (!done && props.steps.length > 0) {
      // 延迟启动，确保页面渲染完成
      setTimeout(() => {
        start();
      }, 800);
    }
  }

  // 监听 resize 重新定位
  globalThis.addEventListener('resize', updatePosition);
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown);
  globalThis.removeEventListener('resize', updatePosition);
});

/** 暴露 start/close 方法 */
defineExpose({
  start,
  close,
});
</script>

<template>
  <Teleport to="body">
    <Transition name="tour-fade">
      <div
        v-if="visible"
        class="tour-overlay-wrapper"
      >
        <!-- 深色半透明遮罩 SVG（通过 clip-path 镂空高亮区） -->
        <svg
          class="tour-overlay-svg"
          :style="{ opacity: String(overlayOpacity) }"
        >
          <defs>
            <mask id="tour-mask">
              <rect
                x="0"
                y="0"
                width="100%"
                height="100%"
                fill="white"
              />
              <rect
                :x="(highlightStyle.left as string)"
                :y="(highlightStyle.top as string)"
                :width="(highlightStyle.width as string)"
                :height="(highlightStyle.height as string)"
                :rx="String(highlightRadius)"
                :ry="String(highlightRadius)"
                fill="black"
              />
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.75)"
            mask="url(#tour-mask)"
          />
        </svg>

        <!-- 高亮边框（脉冲动画） -->
        <div
          v-if="highlightStyle.display !== 'none'"
          class="tour-highlight"
          :style="highlightStyle"
        />

        <!-- Popover 卡片 -->
        <div
          v-if="currentStep"
          class="tour-popover"
          :class="[`tour-popover--${actualPosition}`]"
          :style="popoverStyle"
          role="dialog"
          aria-modal="true"
          :aria-label="currentStep.title || '用户引导'"
        >
          <!-- 标题 -->
          <div
            v-if="currentStep.title"
            class="tour-popover__title"
          >
            {{ currentStep.title }}
          </div>

          <!-- 描述 -->
          <div
            v-if="currentStep.description"
            class="tour-popover__description"
          >
            {{ currentStep.description }}
          </div>

          <!-- 默认插槽（自定义内容覆盖） -->
          <slot :step="currentStep" :index="currentStepIndex">
            <div
              v-if="!currentStep.title && !currentStep.description"
              class="tour-popover__description"
            >
              第 {{ currentStepIndex + 1 }} 步（共 {{ steps.length }} 步）
            </div>
          </slot>

          <!-- 底部操作栏 -->
          <div class="tour-popover__footer">
            <!-- 进度指示 -->
            <div class="tour-popover__progress">
              <span
                v-for="(_, idx) in steps"
                :key="idx"
                :class="[
                  'tour-progress-dot',
                  { 'is-active': idx === currentStepIndex },
                ]"
              />
            </div>

            <!-- 按钮组 -->
            <div class="tour-popover__actions">
              <button
                type="button"
                class="tour-btn tour-btn--skip"
                @click="skip"
              >
                跳过
              </button>
              <button
                v-if="!isFirstStep"
                type="button"
                class="tour-btn tour-btn--prev"
                @click="prev"
              >
                上一步
              </button>
              <button
                type="button"
                class="tour-btn tour-btn--next"
                @click="next"
              >
                {{ isLastStep ? '完成' : '下一步' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="scss" scoped>
.tour-overlay-wrapper {
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: auto;
}

.tour-overlay-svg {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
}

// 高亮聚焦框
.tour-highlight {
  position: fixed;
  z-index: 9998;
  pointer-events: none;
  border: 2px solid hsl(var(--brand-500, #3b82f6));
  box-shadow: 0 0 0 4px rgb(59 130 246 / 25%), 0 0 20px rgb(59 130 246 / 15%);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

// Popover 卡片
.tour-popover {
  position: fixed;
  z-index: 10000;
  padding: 20px;
  background: hsl(var(--bg-surface-2, #fff));
  border: 1px solid hsl(var(--border-subtle, #e5e7eb));
  border-radius: 12px;
  box-shadow: 0 20px 60px rgb(0 0 0 / 30%);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.tour-popover__title {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  color: hsl(var(--txt-primary, #1f2937));
}

.tour-popover__description {
  margin-bottom: 16px;
  font-size: 14px;
  line-height: 1.6;
  color: hsl(var(--txt-secondary, #606266));
}

.tour-popover__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
}

.tour-popover__progress {
  display: flex;
  gap: 6px;
}

.tour-progress-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: hsl(var(--neutral-200, #e5e7eb));
  transition: background 0.2s, transform 0.2s;

  &.is-active {
    background: hsl(var(--brand-500, #3b82f6));
    transform: scale(1.3);
  }
}

.tour-popover__actions {
  display: flex;
  gap: 8px;
}

.tour-btn {
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 500;
  border-radius: 6px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: background-color 0.15s, border-color 0.15s;
}

.tour-btn--skip {
  color: hsl(var(--txt-tertiary, #737373));
  background: transparent;
  border-color: transparent;

  &:hover {
    background: hsl(var(--neutral-50, #f5f5f5));
  }
}

.tour-btn--prev {
  color: hsl(var(--txt-secondary, #606266));
  background: hsl(var(--neutral-50, #f5f5f5));
  border-color: hsl(var(--border-subtle, #e5e7eb));

  &:hover {
    background: hsl(var(--neutral-100, #f0f0f0));
  }
}

.tour-btn--next {
  color: #fff;
  background: hsl(var(--brand-500, #3b82f6));
  border-color: hsl(var(--brand-500, #3b82f6));

  &:hover {
    background: hsl(var(--brand-600, #2563eb));
    border-color: hsl(var(--brand-600, #2563eb));
  }
}

// 过渡动画
.tour-fade-enter-active,
.tour-fade-leave-active {
  transition: opacity 0.25s ease;
}

.tour-fade-enter-from,
.tour-fade-leave-to {
  opacity: 0;
}
</style>
