<!--
 * TimePicker 时间选择器：时分秒三列滚轮 + 12/24 小时制切换。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\time-picker\time-picker.vue
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { TimePickerEmits, TimePickerProps, TimePickerState } from './time-picker-types';

import { computed, ref, watch } from 'vue';

import { Clock } from '@ydsz-core/icons';

defineOptions({ name: 'YdTimePicker' });

const props = withDefaults(defineProps<TimePickerProps>(), {
  allowClear: true,
  format: 'HH:mm:ss',
  hourStep: 1,
  minuteStep: 1,
  placeholder: '选择时间',
  secondStep: 1,
  showSecond: true,
  use12Hours: false,
});

const emit = defineEmits<TimePickerEmits>();

/** 面板是否打开 */
const isOpen = ref(false);

/** 内部时间状态 */
const timeState = ref<TimePickerState>({ hour: 0, minute: 0, second: 0, period: 'AM' });

/** 显示文本 */
const displayText = computed(() => {
  const { hour, minute, second, period } = timeState.value;
  let displayHour = hour;
  if (props.use12Hours) {
    if (hour === 0) displayHour = 12;
    else if (hour > 12) displayHour = hour - 12;
  }
  const hh = String(displayHour).padStart(2, '0');
  const mm = String(minute).padStart(2, '0');
  const ss = String(second).padStart(2, '0');

  if (props.use12Hours && props.showSecond) return `${hh}:${mm}:${ss} ${period}`;
  if (props.use12Hours) return `${hh}:${mm} ${period}`;
  if (props.showSecond) return `${hh}:${mm}:${ss}`;
  return `${hh}:${mm}`;
});

/** 小时选项 */
const hours = computed(() => {
  const max = props.use12Hours ? 12 : 23;
  const start = props.use12Hours ? 1 : 0;
  const result: number[] = [];
  for (let h = start; h <= max; h += props.hourStep) {
    result.push(h);
  }
  return result;
});

/** 分钟选项 */
const minutes = computed(() => {
  const result: number[] = [];
  for (let m = 0; m < 60; m += props.minuteStep) {
    result.push(m);
  }
  return result;
});

/** 秒选项 */
const seconds = computed(() => {
  const result: number[] = [];
  for (let s = 0; s < 60; s += props.secondStep) {
    result.push(s);
  }
  return result;
});

/** 切换面板 */
function toggleOpen(): void {
  if (props.isDisabled) return;
  isOpen.value = !isOpen.value;
  emit('open', isOpen.value);
}

/** 设置时间 */
function setTime(part: keyof TimePickerState, value: number | string): void {
  if (typeof value === 'string') {
    (timeState.value[part] as 'AM' | 'PM') = value as 'AM' | 'PM';
  } else {
    (timeState.value[part] as number) = value;
  }
  emitValue();
}

/** 发出值变更 */
function emitValue(): void {
  emit('update:value', displayText.value);
}

/** 清除 */
function handleClear(): void {
  timeState.value = { hour: 0, minute: 0, second: 0, period: 'AM' };
  emit('update:value', undefined);
}

/** 确定 */
function handleOk(): void {
  emitValue();
  isOpen.value = false;
  emit('open', false);
}

/** 点击外部关闭 */
function handleOutsideClick(): void {
  if (isOpen.value) {
    isOpen.value = false;
    emit('open', false);
  }
}
</script>

<template>
  <div :class="['yd-time-picker', { 'yd-time-picker--open': isOpen, 'yd-time-picker--disabled': isDisabled }]">
    <!-- 触发器 -->
    <button
      :class="['yd-time-picker__trigger', props.class]"
      type="button"
      role="combobox"
      :aria-expanded="isOpen"
      :aria-disabled="isDisabled"
      @click="toggleOpen"
    >
      <Clock class="yd-time-picker__icon" />
      <span class="yd-time-picker__value">{{ displayText }}</span>
    </button>

    <!-- 面板 -->
    <Transition name="yd-timepicker-fade">
      <div v-if="isOpen" class="yd-time-picker__panel" @clickoutside="handleOutsideClick">
        <div class="yd-time-picker__columns">
          <!-- 小时列 -->
          <div class="yd-time-picker__column">
            <div class="yd-time-picker__column-title">时</div>
            <div class="yd-time-picker__options">
              <div
                v-for="h in hours"
                :key="h"
                :class="['yd-time-picker__option', { 'yd-time-picker__option--active': (use12Hours && ((timeState.hour % 12) || 12) === h) || (!use12Hours && timeState.hour === h) }]"
                @click="setTime('hour', use12Hours ? (timeState.period === 'PM' ? h + 12 : h) : h)"
              >
                {{ String(h).padStart(2, '0') }}
              </div>
            </div>
          </div>

          <!-- 分钟列 -->
          <div class="yd-time-picker__column">
            <div class="yd-time-picker__column-title">分</div>
            <div class="yd-time-picker__options">
              <div
                v-for="m in minutes"
                :key="m"
                :class="['yd-time-picker__option', { 'yd-time-picker__option--active': timeState.minute === m }]"
                @click="setTime('minute', m)"
              >
                {{ String(m).padStart(2, '0') }}
              </div>
            </div>
          </div>

          <!-- 秒列 -->
          <div v-if="showSecond" class="yd-time-picker__column">
            <div class="yd-time-picker__column-title">秒</div>
            <div class="yd-time-picker__options">
              <div
                v-for="s in seconds"
                :key="s"
                :class="['yd-time-picker__option', { 'yd-time-picker__option--active': timeState.second === s }]"
                @click="setTime('second', s)"
              >
                {{ String(s).padStart(2, '0') }}
              </div>
            </div>
          </div>

          <!-- AM/PM 列 -->
          <div v-if="use12Hours" class="yd-time-picker__column">
            <div class="yd-time-picker__column-title">上午/下午</div>
            <div class="yd-time-picker__options">
              <div
                :class="['yd-time-picker__option', { 'yd-time-picker__option--active': timeState.period === 'AM' }]"
                @click="setTime('period', 'AM')"
              >
                AM
              </div>
              <div
                :class="['yd-time-picker__option', { 'yd-time-picker__option--active': timeState.period === 'PM' }]"
                @click="setTime('period', 'PM')"
              >
                PM
              </div>
            </div>
          </div>
        </div>

        <!-- 底部操作 -->
        <div class="yd-time-picker__footer">
          <button
            v-if="allowClear"
            class="yd-time-picker__clear"
            type="button"
            @click="handleClear"
          >
            清除
          </button>
          <button class="yd-time-picker__ok" type="button" @click="handleOk">
            确定
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped lang="scss">
.yd-time-picker {
  position: relative;
  display: inline-flex;
}

.yd-time-picker__trigger {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 140px;
  padding: 6px 12px;
  border: 1px solid var(--ydsz-color-border, #d9d9d9);
  border-radius: 6px;
  background: var(--ydsz-color-bg, #fff);
  cursor: pointer;
  font-size: 14px;
  transition: border-color var(--ydsz-motion-duration-fast, 150ms);

  &:hover {
    border-color: var(--ydsz-color-primary, #1677ff);
  }
}

.yd-time-picker--disabled .yd-time-picker__trigger {
  opacity: 0.5;
  cursor: not-allowed;
}

.yd-time-picker__icon {
  width: 16px;
  height: 16px;
  color: var(--ydsz-color-text-secondary, #999);
}

.yd-time-picker__value {
  flex: 1;
  text-align: left;
}

.yd-time-picker__panel {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: var(--ydsz-z-popup, 1000);
  margin-top: 4px;
  padding: 12px;
  border: 1px solid var(--ydsz-color-border, #d9d9d9);
  border-radius: 6px;
  background: var(--ydsz-color-bg, #fff);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  min-width: 220px;
}

.yd-time-picker__columns {
  display: flex;
  gap: 4px;
  margin-bottom: 12px;
}

.yd-time-picker__column {
  flex: 1;
  min-width: 56px;
}

.yd-time-picker__column-title {
  padding: 4px 0;
  text-align: center;
  font-size: 12px;
  color: var(--ydsz-color-text-secondary, #999);
  font-weight: 500;
}

.yd-time-picker__options {
  max-height: 180px;
  overflow-y: auto;
  border: 1px solid var(--ydsz-color-border-light, #f0f0f0);
  border-radius: 4px;
}

.yd-time-picker__option {
  padding: 6px 4px;
  text-align: center;
  cursor: pointer;
  font-size: 13px;
  transition: background-color var(--ydsz-motion-duration-fast, 150ms);

  &:hover {
    background: var(--ydsz-color-bg-hover, #f5f5f5);
  }

  &--active {
    background: var(--ydsz-color-primary-light, #e6f4ff);
    color: var(--ydsz-color-primary, #1677ff);
    font-weight: 500;
  }
}

.yd-time-picker__footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.yd-time-picker__clear {
  padding: 4px 12px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 13px;
  color: var(--ydsz-color-text-secondary, #999);

  &:hover {
    color: var(--ydsz-color-primary, #1677ff);
  }
}

.yd-time-picker__ok {
  padding: 4px 12px;
  border: none;
  border-radius: 4px;
  background: var(--ydsz-color-primary, #1677ff);
  color: #fff;
  cursor: pointer;
  font-size: 13px;

  &:hover {
    background: var(--ydsz-color-primary-hover, #4096ff);
  }
}

.yd-timepicker-fade-enter-active,
.yd-timepicker-fade-leave-active {
  transition: opacity 200ms cubic-bezier(0.4, 0, 0.2, 1), transform 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.yd-timepicker-fade-enter-from,
.yd-timepicker-fade-leave-to {
  opacity: 0;
  transform: translateY(4px);
}
</style>
