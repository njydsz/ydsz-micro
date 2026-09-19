<!--
 * Popconfirm 气泡确认框：在 Popover 中嵌入确认/取消按钮，用于删除等不可逆操作。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\popconfirm\popconfirm.vue
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { PopconfirmEmits, PopconfirmProps } from './popconfirm-types';

import { ref, watch } from 'vue';

import { AlertTriangle } from '@ydsz-core/icons';

defineOptions({ name: 'YdPopconfirm' });

const props = withDefaults(defineProps<PopconfirmProps>(), {
  cancelText: '取消',
  confirmText: '确定',
  confirmVariant: 'primary',
  icon: undefined,
  isLoading: false,
  open: false,
  title: '确认执行此操作？',
  trigger: 'click',
});

const emit = defineEmits<PopconfirmEmits>();

/** 受控/非受控 可见状态 */
const innerOpen = ref(props.open);

watch(
  () => props.open,
  (val) => {
    innerOpen.value = val;
  },
);

function updateOpen(val: boolean): void {
  innerOpen.value = val;
  emit('update:open', val);
}

/** 确认 */
function handleConfirm(): void {
  emit('confirm');
  updateOpen(false);
}

/** 取消 */
function handleCancel(): void {
  emit('cancel');
  updateOpen(false);
}

/** 点击触发区 */
function handleTriggerClick(): void {
  if (props.isDisabled || props.isLoading) return;
  if (props.trigger === 'click') {
    updateOpen(!innerOpen.value);
  }
}
</script>

<template>
  <div :class="['yd-popconfirm', props.class]">
    <!-- 触发区 -->
    <div
      class="yd-popconfirm__trigger"
      role="button"
      tabindex="0"
      aria-haspopup="dialog"
      :aria-expanded="innerOpen"
      @click="handleTriggerClick"
      @keydown.enter="handleTriggerClick"
    >
      <slot />
    </div>

    <!-- 浮层 -->
    <Transition name="yd-popconfirm-fade">
      <div v-if="innerOpen" class="yd-popconfirm__overlay" role="dialog" aria-modal="true">
        <div class="yd-popconfirm__arrow" aria-hidden="true" />
        <div class="yd-popconfirm__content">
          <!-- 标题区 -->
          <div class="yd-popconfirm__header">
            <AlertTriangle v-if="icon !== null" class="yd-popconfirm__icon" />
            <span class="yd-popconfirm__title">{{ title }}</span>
          </div>

          <!-- 自定义内容插槽 -->
          <div class="yd-popconfirm__body">
            <slot name="content" />
          </div>

          <!-- 操作按钮 -->
          <div class="yd-popconfirm__actions">
            <button
              class="yd-popconfirm__btn yd-popconfirm__btn--cancel"
              type="button"
              :disabled="isLoading"
              @click="handleCancel"
            >
              {{ cancelText }}
            </button>
            <button
              :class="[
                'yd-popconfirm__btn',
                'yd-popconfirm__btn--confirm',
                `yd-popconfirm__btn--${confirmVariant}`,
              ]"
              type="button"
              :disabled="isLoading"
              @click="handleConfirm"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped lang="scss">
.yd-popconfirm {
  position: relative;
  display: inline-flex;
}

.yd-popconfirm__trigger {
  display: inline-flex;
  cursor: pointer;
}

.yd-popconfirm__overlay {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  z-index: var(--ydsz-z-popup, 1000);
  margin-bottom: 8px;
  min-width: 220px;
  padding: 12px 16px;
  border: 1px solid var(--ydsz-color-border, #d9d9d9);
  border-radius: 6px;
  background: var(--ydsz-color-bg, #fff);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.yd-popconfirm__arrow {
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%) rotate(45deg);
  width: 10px;
  height: 10px;
  border-right: 1px solid var(--ydsz-color-border, #d9d9d9);
  border-bottom: 1px solid var(--ydsz-color-border, #d9d9d9);
  background: var(--ydsz-color-bg, #fff);
}

.yd-popconfirm__header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.yd-popconfirm__icon {
  width: 18px;
  height: 18px;
  color: var(--ydsz-color-warning, #faad14);
}

.yd-popconfirm__title {
  font-size: 14px;
  font-weight: 500;
  color: var(--ydsz-color-text, #333);
}

.yd-popconfirm__body {
  margin-bottom: 12px;
}

.yd-popconfirm__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.yd-popconfirm__btn {
  padding: 4px 12px;
  border: 1px solid var(--ydsz-color-border, #d9d9d9);
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  line-height: 22px;
  transition: all var(--ydsz-motion-duration-fast, 150ms);

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &--cancel {
    background: var(--ydsz-color-bg, #fff);
    color: var(--ydsz-color-text, #333);

    &:hover:not(:disabled) {
      border-color: var(--ydsz-color-primary, #1677ff);
      color: var(--ydsz-color-primary, #1677ff);
    }
  }

  &--confirm {
    &--primary {
      background: var(--ydsz-color-primary, #1677ff);
      color: #fff;
      border-color: var(--ydsz-color-primary, #1677ff);

      &:hover:not(:disabled) {
        background: var(--ydsz-color-primary-hover, #4096ff);
      }
    }

    &--danger {
      background: var(--ydsz-color-destructive-500, #ff4d4f);
      color: #fff;
      border-color: var(--ydsz-color-destructive-500, #ff4d4f);

      &:hover:not(:disabled) {
        background: var(--ydsz-color-destructive-600, #ff7875);
      }
    }
  }
}

/* 过渡动画 */
.yd-popconfirm-fade-enter-active,
.yd-popconfirm-fade-leave-active {
  transition: opacity 200ms cubic-bezier(0.4, 0, 0.2, 1), transform 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.yd-popconfirm-fade-enter-from,
.yd-popconfirm-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(4px);
}
</style>
