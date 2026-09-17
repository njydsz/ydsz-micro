<!--
 * AlertBanner —— 自研告警横幅组件（替代 EP ElAlert）。
 *
 * 提供 warning / info / error / success 四种语义；默认样式为「警告」(amber)。
 * 图标基于 lucide；可通过 default slot 插入正文（校验提示、帮助说明等）。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\alert\AlertBanner.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import { computed } from 'vue';

import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-vue-next';

import { cn } from '@ydsz-core/shared/utils';

defineOptions({ name: 'YdAlertBanner' });

interface Props {
  /** 标题 */
  title?: string;
  /** 是否展示图标 */
  showIcon?: boolean;
  /** 是否可关闭 */
  closable?: boolean;
  /** 语义类型 */
  type?: 'error' | 'info' | 'success' | 'warning';
}

const props = withDefaults(defineProps<Props>(), {
  closable: false,
  showIcon: true,
  title: '',
  type: 'warning',
});

const emit = defineEmits<{
  close: [];
}>();

/** 语义图标映射 */
const IconComponent = computed(() => {
  const map: Record<'error' | 'info' | 'success' | 'warning', typeof AlertTriangle> = {
    error: AlertCircle,
    info: Info,
    success: CheckCircle2,
    warning: AlertTriangle,
  };
  return map[props.type];
});

/** 语义配色映射 */
const tone = computed(() => {
  const map: Record<'error' | 'info' | 'success' | 'warning', {
    bg: string;
    border: string;
    icon: string;
    title: string;
  }> = {
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: 'text-red-600',
      title: 'text-red-900',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'text-blue-600',
      title: 'text-blue-900',
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: 'text-green-600',
      title: 'text-green-900',
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      icon: 'text-amber-600',
      title: 'text-amber-900',
    },
  };
  return map[props.type];
});

function handleClose(): void {
  emit('close');
}
</script>

<template>
  <div
    v-if="title"
    :class="
      cn(
        'alert-banner',
        'relative flex gap-3 rounded-md border px-3 py-2',
        tone.bg,
        tone.border,
      )
    "
    role="alert"
  >
    <component
      v-if="showIcon"
      :is="IconComponent"
      :class="cn('alert-banner__icon mt-0.5 shrink-0', tone.icon)"
      :size="16"
      aria-hidden="true"
    />
    <div class="alert-banner__content min-w-0 flex-1">
      <div :class="cn('alert-banner__title text-sm font-medium', tone.title)">
        {{ title }}
      </div>
      <div class="alert-banner__body mt-1">
        <slot />
      </div>
    </div>
    <button
      v-if="closable"
      type="button"
      class="alert-banner__close"
      aria-label="关闭"
      @click="handleClose"
    >
      <span aria-hidden="true">&times;</span>
    </button>
  </div>
</template>

<style scoped>
.alert-banner__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  color: hsl(var(--txt-tertiary, #909399));
}

.alert-banner__close:hover {
  color: hsl(var(--txt-primary, #1f2937));
}

.alert-banner__body {
  color: hsl(var(--txt-secondary, #606266));
  font-size: 12px;
}
</style>
