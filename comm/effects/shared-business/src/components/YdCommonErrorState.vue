<!--
 * 统一错误状态组件 — 展示错误信息 + 重试/返回操作
 *
 * 使用自研 YdButtonBase + lucide AlertTriangle/Info/AlertCircle，零 element-plus 依赖。
 *
 * @path comm\effects\shared-business\src\components\error-state.vue
 * @author ydsz-team
 * @since 1.1.0
-->
<script lang="ts" setup>
/**
 * 统一错误状态组件 — 提供错误展示 + 重试/返回操作
 *
 * 使用自研 YdButtonBase 组件；三种 type（error/warning/info）对应不同的图标与配色。
 */
import { computed } from 'vue';

import { AlertCircle, AlertTriangle, Info } from 'lucide-vue-next';

import { cn } from '@ydsz-core/shared/utils';

import { YdButtonBase } from '@ydsz-core/shadcn-ui';

interface Props {
  /** 错误标题 */
  title?: string;
  /** 错误详情 */
  description?: string;
  /** 是否显示重试按钮 */
  showRetry?: boolean;
  /** 是否显示返回按钮 */
  showBack?: boolean;
  /** 错误类型（决定图标色系） */
  type?: 'error' | 'warning' | 'info';
}

const props = withDefaults(defineProps<Props>(), {
  title: '页面出错了',
  description: '请求失败，请稍后重试',
  showRetry: true,
  showBack: false,
  type: 'error',
});

const emit = defineEmits<{
  retry: [];
  back: [];
}>();

/** 图标映射 */
const IconComponent = computed(() => {
  const map: Record<'error' | 'warning' | 'info', typeof AlertCircle> = {
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  };
  return map[props.type];
});

/** 配色映射 */
const toneClasses = computed(() => {
  const map: Record<'error' | 'warning' | 'info', { icon: string; bg: string }> = {
    error: {
      bg: 'bg-red-50',
      icon: 'text-red-600',
    },
    warning: {
      bg: 'bg-amber-50',
      icon: 'text-amber-600',
    },
    info: {
      bg: 'bg-slate-100',
      icon: 'text-slate-500',
    },
  };
  return map[props.type];
});

function handleBack(): void {
  if (window.history.length > 1) {
    window.history.back();
  }
  emit('back');
}
</script>

<template>
  <div :class="cn('error-state', `error-state--${type}`)">
    <div
      :class="[
        'error-state__icon',
        'flex items-center justify-center rounded-full',
        toneClasses.bg,
        toneClasses.icon,
      ]"
      aria-hidden="true"
    >
      <component :is="IconComponent" :size="28" />
    </div>
    <h3 class="error-state__title">{{ title }}</h3>
    <p
      v-if="description"
      class="error-state__desc"
    >
      {{ description }}
    </p>
    <div class="error-state__actions">
      <YdButtonBase
        v-if="showRetry"
        size="sm"
        @click="emit('retry')"
      >
        重试
      </YdButtonBase>
      <YdButtonBase
        v-if="showBack"
        size="sm"
        variant="outline"
        @click="handleBack"
      >
        返回
      </YdButtonBase>
    </div>
    <div
      v-if="$slots.default"
      class="error-state__extra"
    >
      <slot />
    </div>
  </div>
</template>

<style scoped>
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 16px;
  text-align: center;
}

.error-state__icon {
  width: 56px;
  height: 56px;
  margin-bottom: 16px;
}

.error-state__title {
  font-size: 16px;
  font-weight: 600;
  color: hsl(var(--txt-primary, #1f2937));
  margin: 0 0 8px;
}

.error-state__desc {
  font-size: 13px;
  color: hsl(var(--txt-tertiary, #909399));
  margin: 0 0 16px;
  max-width: 320px;
}

.error-state__actions {
  display: flex;
  gap: 8px;
}

.error-state__extra {
  margin-top: 12px;
}
</style>
