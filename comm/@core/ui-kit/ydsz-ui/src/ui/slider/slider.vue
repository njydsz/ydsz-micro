<!--
 * Slider（slider）组件：支持单值与 range 双 thumb 的模式。
 *
 * WAI-ARIA 无障碍改进（云顶 §11 可访问性）:
 * - role="slider" + aria-valuemin / aria-valuemax / aria-valuenow / aria-valuetext
 * - range 模式下两个 thumb 分别暴露 aria-valuenow
 * - 键盘：Arrow（±step）/ Arrow + Shift（±step*5）/ Home / End / PageUp / PageDown
 * - aria-label / aria-labelledby 标签关联
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import { computed, ref } from 'vue';

import type { SliderEmits, SliderProps } from './slider-types';

defineOptions({ name: 'YdSlider' });

const props = withDefaults(defineProps<SliderProps>(), {
  disabled: false,
  modelValue: 50,
  min: 0,
  max: 100,
  step: 1,
  range: false,
});

const emit = defineEmits<SliderEmits>();

/** 当前拖拽激活的 thumb 索引（0=低 / 1=高） */
const activeThumb = ref<number>(0);

/** 计算 thumb 值列表 */
const thumbValues = computed<[number] | [number, number]>(() => {
  if (props.range) {
    const r = props.modelValueRange ?? [
      props.min!,
      props.modelValue ?? props.max!,
    ];
    return [r[0], r[1]];
  }
  return [props.modelValue ?? props.min!];
});

/** 百分比计算 */
function toPercent(value: number): number {
  const min = props.min!;
  const max = props.max!;
  if (max <= min) return 0;
  return ((value - min) / (max - min)) * 100;
}

/** 将像素/键盘步进值约束到 [min, max] 并应用 step */
function snapToStep(raw: number): number {
  const min = props.min!;
  const max = props.max!;
  const step = props.step!;
  const clamped = Math.min(max, Math.max(min, raw));
  const snapped = Math.round((clamped - min) / step) * step + min;
  return Math.min(max, Math.max(min, snapped));
}

/** 单值模式更新 */
function updateSingle(newValue: number) {
  const v = snapToStep(newValue);
  emit('update:modelValue', v);
}

/** range 模式更新 */
function updateRange(index: 0 | 1, newValue: number) {
  const v = snapToStep(newValue);
  const current = thumbValues.value as [number, number];
  const next: [number, number] = [...current] as [number, number];
  next[index] = v;
  // 确保低 ≤ 高
  if (index === 0 && next[0] > next[1]) next[1] = next[0];
  if (index === 1 && next[1] < next[0]) next[0] = next[1];
  emit('update:modelValueRange', next);
}

/** thumb 聚焦 */
function focusThumb(index: number) {
  activeThumb.value = index;
}

/** 键盘事件：Arrow/Home/End/PageUp/PageDown */
function handleThumbKeydown(event: KeyboardEvent, index: number) {
  if (props.disabled) return;
  const step = props.step!;
  const multiplier = event.shiftKey ? 5 : 1;
  const delta =
    event.key === 'ArrowRight' || event.key === 'ArrowUp'
      ? step * multiplier
      : event.key === 'ArrowLeft' || event.key === 'ArrowDown'
        ? -step * multiplier
        : event.key === 'Home'
          ? -Infinity
          : event.key === 'End'
            ? Infinity
            : event.key === 'PageUp'
              ? step * 10
              : event.key === 'PageDown'
                ? -step * 10
                : 0;

  if (delta === 0) return;
  event.preventDefault();

  if (props.range) {
    const current = thumbValues.value as [number, number];
    const target = delta === -Infinity ? props.min! : delta === Infinity ? props.max! : current[index] + delta;
    updateRange(index as 0 | 1, target);
  } else {
    const target = delta === -Infinity ? props.min! : delta === Infinity ? props.max! : thumbValues.value[0] + delta;
    updateSingle(target);
  }
  emit('change', props.range ? thumbValues.value : thumbValues.value[0]);
}

/** aria-valuetext 描述 */
const ariaValueText = computed(() => {
  if (props.range) {
    const v = thumbValues.value as [number, number];
    return `${v[0]} - ${v[1]}`;
  }
  return String(thumbValues.value[0]);
});

/** 滑块 track 点击定位 */
function handleTrackClick(event: MouseEvent) {
  if (props.disabled) return;
  const track = event.currentTarget as HTMLElement;
  const rect = track.getBoundingClientRect();
  const percent = (event.clientX - rect.left) / rect.width;
  const raw = props.min! + percent * (props.max! - props.min!);
  const snapped = snapToStep(raw);
  if (props.range) {
    // 点击时更新更近的 thumb
    const [lo, hi] = thumbValues.value as [number, number];
    const dLo = Math.abs(snapped - lo);
    const dHi = Math.abs(snapped - hi);
    updateRange(dLo <= dHi ? 0 : 1, snapped);
    activeThumb.value = dLo <= dHi ? 0 : 1;
  } else {
    updateSingle(snapped);
  }
  emit('change', props.range ? thumbValues.value : thumbValues.value[0]);
}

/** 单 thumb 的 aria 属性（用于模板复用） */
function thumbAria(index: number) {
  return {
    role: 'slider' as const,
    'aria-valuemin': String(props.min),
    'aria-valuemax': String(props.max),
    'aria-valuenow': String(thumbValues.value[index]),
    'aria-valuetext': ariaValueText.value,
    'aria-disabled': props.disabled ? ('true' as const) : undefined,
    'aria-label': props.ariaLabel ?? undefined,
    'aria-labelledby': props.ariaLabelledby ?? undefined,
    'aria-orientation': 'horizontal' as const,
  };
}

/** 滑轨宽度与位置（range 模式） */
const trackFillStyle = computed(() => {
  if (props.range) {
    const [lo, hi] = thumbValues.value as [number, number];
    return {
      left: `${toPercent(lo)}%`,
      width: `${toPercent(hi) - toPercent(lo)}%`,
    };
  }
  return {
    width: `${toPercent(thumbValues.value[0])}%`,
  };
});

/** 单个 thumb 位置 */
function thumbStyle(index: number) {
  return {
    left: `${toPercent(thumbValues.value[index])}%`,
  };
}
</script>

<template>
  <div
    :class="['yd-slider', `yd-slider--${range ? 'range' : 'single'}`, { 'yd-slider--disabled': disabled }, props.class]"
    role="group"
    :aria-label="ariaLabel ?? undefined"
    :aria-labelledby="ariaLabelledby ?? undefined"
  >
    <!-- 滑轨 -->
    <div
      class="yd-slider__track"
      role="presentation"
      @click="handleTrackClick"
    >
      <div
        class="yd-slider__track-fill"
        :style="trackFillStyle"
      />
    </div>
    <!-- thumb(s) -->
    <div
      v-for="(val, i) in thumbValues"
      :key="i"
      v-bind="thumbAria(i)"
      class="yd-slider__thumb"
      :class="{ 'yd-slider__thumb--active': activeThumb === i }"
      :style="thumbStyle(i)"
      tabindex="0"
      @focus="focusThumb(i)"
      @keydown="handleThumbKeydown($event, i)"
    >
      <span class="yd-slider__thumb-dot" />
    </div>
  </div>
</template>

<style scoped>
.yd-slider {
  display: inline-flex;
  align-items: center;
  position: relative;
  width: 100%;
  height: 1.25rem;
  touch-action: none;
  user-select: none;
}

.yd-slider--disabled {
  opacity: 0.5;
  pointer-events: none;
}

/* 滑轨 */
.yd-slider__track {
  position: absolute;
  left: 0;
  right: 0;
  height: 0.375rem;
  border-radius: var(--ydsz-radius-full, 9999px);
  background-color: hsl(var(--ydsz-surface-2, var(--ydsz-surface-1)));
  cursor: pointer;
}

.yd-slider__track-fill {
  position: absolute;
  height: 100%;
  background-color: hsl(var(--ydsz-comp-bg, 210 100% 50%));
  border-radius: inherit;
}

/* thumb */
.yd-slider__thumb {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 1rem;
  height: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  outline: none;
  /* 让 thumb 可获取焦点但不显示默认 outline，改由 dot 显示 */
}

.yd-slider__thumb-dot {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 9999px;
  background-color: hsl(var(--ydsz-surface-1));
  border: 2px solid hsl(var(--ydsz-comp-bg, 210 100% 50%));
  box-shadow: 0 1px 2px hsl(0 0% 0% / 0.1);
  transition: box-shadow var(--ydsz-motion-duration-fast, 150ms) var(--ydsz-motion-easing-standard, ease);
}

.yd-slider__thumb:focus-visible .yd-slider__thumb-dot,
.yd-slider__thumb--active .yd-slider__thumb-dot {
  box-shadow: 0 0 0 3px hsl(var(--ydsz-comp-bg, 210 100% 50%) / 0.3);
}

.yd-slider__thumb:active .yd-slider__thumb-dot {
  cursor: grabbing;
  box-shadow: 0 0 0 4px hsl(var(--ydsz-comp-bg, 210 100% 50%) / 0.4);
}
</style>
